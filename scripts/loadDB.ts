import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "dotenv/config";

type SimilarityMetric = "cosine" | "dot_product" | "euclidean";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: process.env.AIML_API_KEY!,
  baseURL: process.env.AIML_API_BASE || 'https://api.aimlapi.com/v1',
});

const f1Data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://www.skysports.com/f1/news/12433/13117256/lewis-hamilton-says-move-to-ferrari-from-mercedes=doesn-t-need-vindicating-amid-irritation-at-coverage",
  "https://www.formula1.com/en/latest/all",
  "https://www.forbes.com/sites/brettknight/2023/11/29/formula-1s-highest-paid-drivers-2023/?sh=12bdb942463f",
  "https://www.autosport.com/f1/news/history-of-female-f1-drivers-including-grand-prix-starters-and-test-drivers/10584871/",
  "https://en.wikipedia.org/wiki/2021_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/2022_Formula_One_World_Championship",
  "https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions",
  "https://en.wikipedia.org/wiki/2024_Formula_One_World_Championship",
  "https://www.formula1.com/en/results.html/2024/races.html",
  "https://www.formula1.com/en/racing/2024.html",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  console.log(
    `🛠️ Creating collection "${ASTRA_DB_COLLECTION}" with metric=${similarityMetric}...`
  );
  const res = await db.createCollection(ASTRA_DB_COLLECTION!, {
    vector: {
      dimension: 1536,
      metric: similarityMetric,
    },
  });
  console.log("✅ Collection created:", res);
};

const loadSampleData = async () => {
  const collection = db.collection(ASTRA_DB_COLLECTION!);

  for await (const url of f1Data) {
    console.log(`🌐 Scraping: ${url}`);
    const content = await scrapePage(url);

    console.log(`✂️ Splitting content from ${url} into chunks...`);
    const chunks = await splitter.splitText(content);
    console.log(`📦 Got ${chunks.length} chunks from ${url}`);

    let counter = 0;
    for await (const chunk of chunks) {
      counter++;
      console.log(
        `➡️ [${url}] Chunk ${counter}/${chunks.length}: creating embedding...`
      );

      const embedding = await openai.embeddings.create({
        model: process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small',
        input: chunk,
        encoding_format: "float",
      });

      const vector = embedding.data[0].embedding;
      console.log(`🧠 Embedding length: ${vector.length}`);

      console.log(`📝 Inserting chunk ${counter} into Astra DB...`);
      const res = await collection.insertOne({
        $vector: vector,
        text: chunk,
        metadata: { source: url, chunk: counter },
      });
      console.log("✅ Inserted:", res);
    }
  }
  console.log("🎉 All data loaded into Astra DB");
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const content = await page.evaluate(() => document.body.innerHTML);
      await browser.close();
      return content;
    },
  });
  console.log(`🔍 Starting scrape of ${url}`);
  const raw = await loader.scrape();
  console.log(`📄 Scraped raw HTML length from ${url}: ${raw?.length}`);
  return raw?.replace(/<[^>]+>?/gm, "") ?? "";
};

createCollection().then(() => {
  loadSampleData();
});
