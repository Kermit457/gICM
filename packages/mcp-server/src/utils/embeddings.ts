/**
 * OpenAI embeddings
 */

import OpenAI from "openai";
import { getOpenAIKey } from "./config.js";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = getOpenAIKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getOpenAI();

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}
