![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

# F1GPT — RAG Chatbot for Formula One (Next.js)

F1GPT is a Retrieval-Augmented Generation (RAG) chatbot built with **Next.js 15** and the **Vercel AI SDK**.
It scrapes and indexes Formula One sources into a vector database (**DataStax Astra DB**), retrieves the most relevant chunks for a user’s question, and streams answers from **GPT-5** via the **AI/ML API** — styled with a Formula One-themed UI.

Built for Co-Creating with GPT-5 using AI/ML API.

⚡ Built for the **[Co-Creating with GPT-5 Hackathon](https://lablab.ai/event/co-creating-with-gpt-5)**.

---

## ✨ Highlights

- Modern **Next.js App Router** with real-time streaming chat UI
- **RAG pipeline**: Puppeteer scraping → LangChain chunking → Embeddings (AI/ML API) → Astra DB vector search
- **GPT-5 reasoning**: contextual responses streamed via AI/ML API (`openai/gpt-5-2025-08-07`)
- Secure **serverless API route** with token-safe server-side access
- **Tailwind CSS v4** for F1-inspired UI
- Dockerfile included for containerized runs

---

## 🛠️ Tech Stack

- **Next.js 15, React 19**
- **Vercel AI SDK (`ai`)** for streaming responses
- **AI/ML API** (chat with GPT-5 + `text-embedding-3-small` embeddings)
- **DataStax Astra DB Vector** for storage & similarity search
- **LangChain** text splitters, **Puppeteer** for scraping
- **TypeScript**, **ESLint**, **Tailwind CSS v4**

---

## ⚙️ How it works

1. **Seeding** (`scripts/loadDB.ts`)

   - Scrapes curated F1 URLs with Puppeteer
   - Cleans & splits text into overlapping chunks
   - Generates embeddings (`openai/text-embedding-3-small` via AI/ML API)
   - Inserts documents into an Astra DB collection (1536-dim vector)
2. **Querying** (`app/api/chat/route.ts`)

   - Embeds the latest user query
   - Runs a vector similarity search (top 10 hits from Astra DB)
   - Injects context into a system prompt
3. **Answering**

   - Streams a GPT-5 completion back to the client using the Vercel AI SDK

---

## 📦 Prerequisites

- Node.js 20+
- [AI/ML API Key](https://aimlapi.com/) ($20 hackathon credits via code `GPT5HACK`)
- DataStax Astra DB (Serverless Vector) project with:
  - Application Token
  - Data API Endpoint
  - Namespace (Keyspace)
  - Collection name

---

## 🔑 Environment Variables

Create a `.env.local` (for the app) and `.env` (for seeding). The app (Next.js) reads from `.env.local`; the seed script uses `dotenv` which reads `.env` by default.

```ini
# Astra DB
ASTRA_DB_NAMESPACE=f1gpt
ASTRA_DB_COLLECTION=f1gpt_docs
ASTRA_DB_API_ENDPOINT=https://<your-db-id>-<region>.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:********************************

# AI/ML API
AIML_API_KEY=********************************
AIML_API_BASE=https://api.aimlapi.com/v1
GPT5_MODEL=openai/gpt-5-2025-08-07
EMBEDDING_MODEL=openai/text-embedding-3-small

# Optional quality-of-life
# NEXT_TELEMETRY_DISABLED=1
# PORT=3000

Tips:
- For seeding only, `.env` is sufficient because `scripts/loadDB.ts` imports `dotenv/config`.
- For the app/API route, use `.env.local` so Next.js picks it up.
```

---

## 🚀 Installation

```bash
npm install
```

### Seed the database

```bash
npm run seed
```

> Creates a 1536-dim collection in Astra DB and loads scraped F1 data.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production build

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t f1gpt .
docker run --rm -p 3000:3000 --env-file .env.local f1gpt
```

---

## 🗂️ Project Structure

```
app/
  api/chat/route.ts        # Chat API: RAG retrieval + GPT-5 streaming
  components/              # UI components
  page.tsx                 # Main chat page
  layout.tsx               # App layout & metadata
scripts/
  loadDB.ts                # Puppeteer scrape + embed + Astra insert
```

---

## ⚡ Configuration

- **Embeddings model**: `openai/text-embedding-3-small` (1536 dims)
- **Chat model**: `openai/gpt-5-2025-08-07` (AI/ML API)
- **API base**: `https://api.aimlapi.com/v1` (override via `AIML_API_BASE`)
- **Similarity metric**: `dot_product`
- **Chunking**: Recursive splitter (size 512, overlap 100)

## 🤖 Why GPT-5?

Short version: fewer hallucinations under retrieved context and better long-context answers.

In informal side-by-side checks on F1 queries using this RAG setup (10 retrieved chunks):

- GPT-5 adhered more closely to retrieved facts, reducing speculative claims.
- Multi-chunk synthesis was more consistent and specific.
- With longer inputs (multi-turn + context >8k tokens), response quality degraded less vs. smaller/older models.

Note: These observations are not a formal benchmark. Results depend on retrieval quality, prompt design, and model availability/cost.

## 📜 License

[MIT License](./LICENSE) © 2025 Muhammad Huzaifa

---

## 🙏 Acknowledgements

- [Vercel AI SDK](https://sdk.vercel.ai/)
- [AI/ML API](https://aimlapi.com/) — powering GPT-5 & embeddings
- [DataStax Astra DB](https://www.datastax.com/astra)
- [LangChain](https://www.langchain.com/)
- Formula One knowledge sources (scraped respectfully, ToS-compliant)
