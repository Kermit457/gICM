/**
 * Qdrant client wrapper
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import { getQdrantUrl } from "./config.js";

let client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({
      url: getQdrantUrl(),
    });
  }
  return client;
}
