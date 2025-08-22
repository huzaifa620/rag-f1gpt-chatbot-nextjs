import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  AIML_API_KEY,
  AIML_API_BASE,
  EMBEDDING_MODEL,
  GPT5_MODEL,
} = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

async function embedTextRaw(text: string): Promise<number[]> {
  const base = (AIML_API_BASE || "https://api.aimlapi.com/v1").replace(
    /\/+$/,
    ""
  );
  const model = (EMBEDDING_MODEL || "text-embedding-3-small").trim();

  const res = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIML_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      encoding_format: "float",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Embeddings HTTP ${res.status}: ${body || "no body"}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    const queryVector = await embedTextRaw(String(latestMessage));

    let docContext = "";
    try {
      const collection = db.collection(ASTRA_DB_COLLECTION!);
      const cursor = collection.find(null, {
        sort: { $vector: queryVector },
        limit: 8,
      });

      const documents = await cursor.toArray();
      const docsMap = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docsMap);
    } catch (err) {
      console.log("Error:", err);
      docContext = "";
    }

    const template = {
      role: "system",
      content: `You are an AI assistant who knows everything about Formula One.
Use the below context to augment what you know about Formula One racing.
The context will provide you with the most recent page data from wikipedia,
the official F1 website and others.
If the context doesn't include the information you need, answer based on your
existing knowledge and don't mention the source of your information or
what the context does or doesn't include.
Format responses using markdown where applicable and don't return images.

--------------------
START CONTEXT
${docContext}
END CONTEXT
--------------------
QUESTION: ${latestMessage}
--------------------`,
    };

    // ✅ raw POST for chat completions
    const base = (AIML_API_BASE || "https://api.aimlapi.com/v1").replace(
      /\/+$/,
      ""
    );
    const model = (GPT5_MODEL || "openai/gpt-5-nano-2025-08-07").trim();

    const completionRes = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIML_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [template, ...messages],
      }),
    });

    const stream = OpenAIStream(completionRes.body!);
    return new StreamingTextResponse(stream);
  } catch (err) {
    console.error("Error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
