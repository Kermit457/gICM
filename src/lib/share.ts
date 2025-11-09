import type { RegistryItem } from "@/types/registry";

export interface ShareableStack {
  itemIds: string[];
  name?: string;
  description?: string;
}

/**
 * Encode stack data into a URL-safe string
 */
export function encodeStack(itemIds: string[]): string {
  const data = JSON.stringify(itemIds);
  const base64 = Buffer.from(data).toString('base64');
  // Make URL-safe by replacing +/= with -_~
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '~');
}

/**
 * Decode URL-safe string back to item IDs
 */
export function decodeStack(encoded: string): string[] {
  try {
    // Reverse URL-safe replacements
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/~/g, '=');
    const data = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to decode stack:', error);
    return [];
  }
}

/**
 * Generate shareable URL for a stack
 */
export function generateShareUrl(itemIds: string[], baseUrl?: string): string {
  const encoded = encodeStack(itemIds);
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/?stack=${encoded}`;
}

/**
 * Parse stack from URL query parameters
 */
export function parseStackFromUrl(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const stackParam = urlObj.searchParams.get('stack');
    if (!stackParam) return [];
    return decodeStack(stackParam);
  } catch (error) {
    console.error('Failed to parse URL:', error);
    return [];
  }
}

/**
 * Get stack parameter from current URL (client-side only)
 */
export function getStackFromCurrentUrl(): string[] {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const stackParam = params.get('stack');
  if (!stackParam) return [];
  return decodeStack(stackParam);
}
