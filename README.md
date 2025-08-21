## F1GPT — RAG Chatbot for Formula One (Next.js)

F1GPT is a Retrieval-Augmented Generation (RAG) chatbot built with Next.js 15 and the Vercel AI SDK. It scrapes and indexes popular Formula One sources into a vector database (DataStax Astra DB), retrieves the most relevant chunks for a user’s question, and streams answers from OpenAI—styled with an F1-themed UI.

### Highlights

- Modern Next.js App Router with streaming chat UI
- RAG pipeline: Puppeteer scraping → chunking (LangChain) → OpenAI embeddings → Astra DB vector search
- Serverless API route with token-safe server-side access
- Tailwind CSS v4 styling
- Dockerfile included for containerized dev runs

## Tech Stack

- Next.js 15, React 19
- Vercel AI SDK (`ai`) for streaming responses
- OpenAI API (chat + `text-embedding-3-small` embeddings)
- DataStax Astra DB Vector for storage and similarity search
- LangChain text splitters, Puppeteer for web scraping
- TypeScript, ESLint, Tailwind CSS v4

## How it works

1. Seeding: `scripts/loadDB.ts` scrapes a curated list of F1 URLs with Puppeteer, removes HTML, splits text into overlapping chunks, generates embeddings via OpenAI, and writes documents into an Astra DB collection with a 1536-dimension vector.
2. Querying: `app/api/chat/route.ts` embeds the latest user message, performs a vector search on Astra DB (top 10 by similarity), and injects the retrieved context into a system prompt.
3. Answering: The API streams a chat completion back to the client using the Vercel AI SDK’s `OpenAIStream`.

## Prerequisites

- Node.js 20+
- OpenAI API Key
- DataStax Astra DB (Serverless Vector) project with:
  - Application Token
  - API Endpoint (Data API)
  - Namespace (Keyspace)
  - Collection name for vectors

## Environment variables

Create environment files at the project root. The app (Next.js) reads from `.env.local`; the seed script uses `dotenv` which reads `.env` by default. You can duplicate the same values in both files or keep one file and run accordingly.

Required variables:

- `ASTRA_DB_NAMESPACE` — Astra DB keyspace/namespace
- `ASTRA_DB_COLLECTION` — Collection to store vectors and text
- `ASTRA_DB_API_ENDPOINT` — Data API endpoint (e.g., https://`<db-id>`-`<region>`.apps.astra.datastax.com)
- `ASTRA_DB_APPLICATION_TOKEN` — Astra DB application token (starts with `AstraCS:`)
- `OPENAI_API_KEY` — OpenAI API key

Example `.env.local` (for the web app):

```ini
ASTRA_DB_NAMESPACE=f1gpt
ASTRA_DB_COLLECTION=f1gpt_docs
ASTRA_DB_API_ENDPOINT=https://<your-db-id>-<region>.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:********************************
OPENAI_API_KEY=sk-********************************
```

If you run the seed script, also create a `.env` with the same values (or adjust how you load envs).

## Installation

```bash
npm install
```

## Seed the database (recommended before first run)

This will create the collection (1536-dim, dot_product metric) and load scraped/chunked content.

```bash
npm run seed
```

Notes:

- Seeding uses Puppeteer and may take several minutes on the first run (Chromium download + scraping).
- Scraped sources are defined in `scripts/loadDB.ts` (`f1Data` array). Respect website terms of service.

## Run the app (development)

```bash
npm run dev
```

Then open http://localhost:3000

## Production build

```bash
npm run build
npm start
```

## Docker

The provided Dockerfile starts the dev server (port 3000).

Build and run:

```bash
docker build -t f1gpt .
docker run --rm -p 3000:3000 --env-file .env.local f1gpt
```

Tip: For production images, consider switching the CMD to `npm start` after `npm run build` and adding a minimal runtime base image.

## Project structure

```
app/
	api/chat/route.ts        # Streaming chat API, RAG retrieval + OpenAI
	components/              # Chat UI components
	page.tsx                 # Main chat page
	layout.tsx               # App layout and metadata
scripts/
	loadDB.ts                # Puppeteer scrape + chunk + embed + Astra insert
```

## Configuration knobs

- Embeddings model: `text-embedding-3-small` (1536 dims). Change in `scripts/loadDB.ts` and `app/api/chat/route.ts` if needed.
- Chat model: set in `app/api/chat/route.ts` (default: `gpt-5-nano` in code). Update to your preferred available OpenAI model.
- Similarity metric: default `dot_product`. Change in `createCollection` in `scripts/loadDB.ts`.
- Chunking: `RecursiveCharacterTextSplitter` with size 512 and overlap 100.

## Acknowledgements

- Vercel AI SDK
- OpenAI
- DataStax Astra DB
- LangChain
