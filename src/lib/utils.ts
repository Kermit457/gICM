import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a product name with a "/" prefix
 * @param name - The product name to format
 * @returns The formatted product name with "/" prefix
 */
export function formatProductName(name: string): string {
  return `/${name}`;
}
