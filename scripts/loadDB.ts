import "dotenv/config";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const must = (k: string, v?: string) => {
  if (!v || !v.trim()) throw new Error(`Missing required env: ${k}`);
  return v.trim();
};

const ASTRA_DB_NAMESPACE = must(
  "ASTRA_DB_NAMESPACE",
  process.env.ASTRA_DB_NAMESPACE
);
const ASTRA_DB_COLLECTION = must(
  "ASTRA_DB_COLLECTION",
  process.env.ASTRA_DB_COLLECTION
);
const ASTRA_DB_API_ENDPOINT = must(
  "ASTRA_DB_API_ENDPOINT",
  process.env.ASTRA_DB_API_ENDPOINT
);
const ASTRA_DB_APPLICATION_TOKEN = must(
  "ASTRA_DB_APPLICATION_TOKEN",
  process.env.ASTRA_DB_APPLICATION_TOKEN
);

const AIML_API_KEY = must("AIML_API_KEY", process.env.AIML_API_KEY);
const AIML_API_BASE = (
  process.env.AIML_API_BASE || "https://api.aimlapi.com/v1"
).replace(/\/+$/, "");
const EMBEDDING_MODEL = (
  process.env.EMBEDDING_MODEL || "text-embedding-3-small"
).trim();
const VECTOR_DIM = 1536;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

const f1Data: string[] = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://www.skysports.com/f1/news/12433/13117256/lewis-hamilton-says-move-to-ferrari-from-mercedes=doesn-t-need-vindicating-amid-irritation-at-coverage",
  "https://www.formula1.com/en/latest/all",
  "https://www.forbes.com/sites/brettknight/2023/11/29/formula-1s-highest-paid-drivers-2023/?sh=12bdb942463f",
  "https://www.autosport.com/f1/news/history-of-female-f1-drivers-including-grand-prix-starters-and-test-drivers/10584871/",
  "https://en.wikipedia.org/wiki/2021_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2025_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions",
  "https://www.formula1.com/en/results/2024/races",
  "https://www.formula1.com/en/results/2025/races",
  "https://www.formula1.com/en/racing/2024.html",
  "https://www.formula1.com/en/racing/2025.html",
];

const scrapePage = async (url: string) => {
  console.log(`🌐 Scraping: ${url}`);
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    },
    gotoOptions: { waitUntil: "domcontentloaded" },
    evaluate: async (page, browser) => {
      const text = await page.evaluate(() => document.body.innerText || "");
      await browser.close();
      return text;
    },
  });
  const raw = await loader.scrape();
  console.log(`📄 Scraped raw length from ${url}: ${raw?.length ?? 0}`);
  return raw ?? "";
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

type EmbeddingResponse = {
  data: { embedding: number[] }[];
};

async function embedTextsRaw(inputs: string | string[]): Promise<number[][]> {
  const res = await fetch(`${AIML_API_BASE}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIML_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: inputs,
      encoding_format: "float",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Embeddings HTTP ${res.status}: ${text || "no body"}`);
  }

  const json = (await res.json()) as EmbeddingResponse;
  return json.data.map((d) => d.embedding);
}

async function ensureCollection() {
  console.log(
    `🛠️ Creating collection "${ASTRA_DB_COLLECTION}" in namespace "${ASTRA_DB_NAMESPACE}" (dim=${VECTOR_DIM}, metric=dot_product)…`
  );
  await db.createCollection(ASTRA_DB_COLLECTION, {
    vector: { dimension: VECTOR_DIM, metric: "dot_product" },
  });
  console.log(
    `✅ Collection created: Collection(keyspace="${ASTRA_DB_NAMESPACE}",name="${ASTRA_DB_COLLECTION}")`
  );
}

async function loadSampleData() {
  const collection = db.collection(ASTRA_DB_COLLECTION);

  // Probe one embedding
  console.log("🧪 Probe embedding…");
  const [probe] = await embedTextsRaw("hello world");
  console.log("✅ Probe dim:", probe.length);

  for (const url of f1Data) {
    const content = await scrapePage(url);

    console.log(`✂️ Splitting content from ${url} into chunks…`);
    const chunks = await splitter.splitText(content);
    console.log(`📦 Got ${chunks.length} chunks from ${url}`);

    const BATCH = 32;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);

      console.log(
        `➡️ [${url}] Chunks ${i + 1}-${Math.min(
          i + BATCH,
          chunks.length
        )}: creating embeddings…`
      );

      const vectors = await embedTextsRaw(batch);

      const docs = batch.map((text, idx) => ({
        text,
        $vector: vectors[idx],
        metadata: { source: url, chunk: i + idx + 1 },
      }));

      await collection.insertMany(docs);
      console.log(
        `✅ Inserted ${Math.min(i + BATCH, chunks.length)}/${
          chunks.length
        } for ${url}`
      );
    }
  }

  console.log("🎉 Seeding complete");
}

ensureCollection()
  .then(loadSampleData)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
