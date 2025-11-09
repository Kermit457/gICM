import fetch from 'node-fetch';
const REGISTRY_API = process.env.GICM_API_URL || 'https://gicm.dev/api';
export async function fetchRegistry() {
    const response = await fetch(`${REGISTRY_API}/registry`);
    if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.statusText}`);
    }
    return response.json();
}
export async function fetchItem(slug) {
    const response = await fetch(`${REGISTRY_API}/items/${slug}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Item not found: ${slug}`);
        }
        throw new Error(`Failed to fetch item: ${response.statusText}`);
    }
    return response.json();
}
export async function fetchItemFiles(slug) {
    const response = await fetch(`${REGISTRY_API}/items/${slug}/files`);
    if (!response.ok) {
        throw new Error(`Failed to fetch files for ${slug}: ${response.statusText}`);
    }
    return response.json();
}
export async function searchItems(query, filters) {
    const params = new URLSearchParams({ q: query });
    if (filters?.kind)
        params.append('kind', filters.kind);
    if (filters?.tag)
        params.append('tag', filters.tag);
    const response = await fetch(`${REGISTRY_API}/search?${params}`);
    if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
    }
    return response.json();
}
export function resolveDependencies(item, registry) {
    const resolved = new Set([item.id]);
    const queue = [...item.dependencies];
    const result = [item];
    while (queue.length > 0) {
        const depId = queue.shift();
        if (resolved.has(depId))
            continue;
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
//# sourceMappingURL=registry.js.map