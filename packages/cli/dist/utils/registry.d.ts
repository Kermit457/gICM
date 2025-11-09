import type { RegistryItem } from './types.js';
export declare function fetchRegistry(): Promise<RegistryItem[]>;
export declare function fetchItem(slug: string): Promise<RegistryItem>;
export declare function fetchItemFiles(slug: string): Promise<{
    path: string;
    content: string;
}[]>;
export declare function searchItems(query: string, filters?: {
    kind?: string;
    tag?: string;
}): Promise<RegistryItem[]>;
export declare function resolveDependencies(item: RegistryItem, registry: RegistryItem[]): RegistryItem[];
//# sourceMappingURL=registry.d.ts.map