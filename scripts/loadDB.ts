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
  apiKey: OPENAI_API_KEY,
});

const f1Data = [
  "https://en.wikipedia.org/wiki/Formula_One",
  "https://www.formula1.com/en/latest",
  "https://www.formula1.com",
  "https://www.skysports.com/f1",
  "https://www.skysports.com/f1/news",
  "https://www.skysports.com/f1/schedule-results",
  "https://www.skysports.com/f1/watch",
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { keyspace: ASTRA_DB_NAMESPACE });

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
        model: "text-embedding-3-small",
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
