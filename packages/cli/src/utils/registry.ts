import fetch from 'node-fetch';
import type { RegistryItem } from './types.js';

const REGISTRY_API = process.env.GICM_API_URL || 'https://gicm.dev/api';

export async function fetchRegistry(): Promise<RegistryItem[]> {
  const response = await fetch(`${REGISTRY_API}/registry`);

  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.statusText}`);
  }

  return response.json() as Promise<RegistryItem[]>;
}

export async function fetchItem(slug: string): Promise<RegistryItem> {
  const response = await fetch(`${REGISTRY_API}/items/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Item not found: ${slug}`);
    }
    throw new Error(`Failed to fetch item: ${response.statusText}`);
  }

  return response.json() as Promise<RegistryItem>;
}

export async function fetchItemFiles(slug: string): Promise<{ path: string; content: string }[]> {
  const response = await fetch(`${REGISTRY_API}/items/${slug}/files`);

  if (!response.ok) {
    throw new Error(`Failed to fetch files for ${slug}: ${response.statusText}`);
  }

  return response.json() as Promise<{ path: string; content: string }[]>;
}

export async function searchItems(query: string, filters?: { kind?: string; tag?: string }): Promise<RegistryItem[]> {
  const params = new URLSearchParams({ q: query });
  if (filters?.kind) params.append('kind', filters.kind);
  if (filters?.tag) params.append('tag', filters.tag);

  const response = await fetch(`${REGISTRY_API}/search?${params}`);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json() as Promise<RegistryItem[]>;
}

export function resolveDependencies(item: RegistryItem, registry: RegistryItem[]): RegistryItem[] {
  const resolved = new Set<string>([item.id]);
  const queue = [...item.dependencies];
  const result: RegistryItem[] = [item];

  while (queue.length > 0) {
    const depId = queue.shift()!;

    if (resolved.has(depId)) continue;

    const depItem = registry.find(i => i.id === depId);
    if (!depItem) {
      console.warn(`Warning: Dependency not found: ${depId}`);
      continue;
    }

    resolved.add(depId);
    result.push(depItem);
    queue.push(...depItem.dependencies);
  }

  return result;
}
