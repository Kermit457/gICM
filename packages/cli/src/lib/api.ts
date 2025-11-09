/**
 * API client for gICM marketplace
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import chalk from 'chalk';
import type { RegistryItem, FileContent, BundleResponse } from './types';

export class GICMAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(apiUrl?: string) {
    this.baseURL = apiUrl || 'https://gicm-marketplace.vercel.app/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch a single item by slug
   */
  async getItem(slug: string): Promise<RegistryItem> {
    try {
      const { data } = await this.client.get<RegistryItem>(`/items/${slug}`);
      return data;
    } catch (error) {
      this.handleError(error, `Failed to fetch item: ${slug}`);
      throw error;
    }
  }

  /**
   * Download file contents for an item
   */
  async getFiles(slug: string): Promise<FileContent[]> {
    try {
      const { data } = await this.client.get<FileContent[]>(`/items/${slug}/files`);
      return data;
    } catch (error) {
      this.handleError(error, `Failed to download files for: ${slug}`);
      throw error;
    }
  }

  /**
   * Resolve dependencies for a list of items
   */
  async resolveBundle(itemIds: string[]): Promise<BundleResponse> {
    try {
      const { data } = await this.client.post<BundleResponse>('/bundles/generate', {
        itemIds,
      });
      return data;
    } catch (error) {
      this.handleError(error, 'Failed to resolve dependencies');
      throw error;
    }
  }

  /**
   * Fetch all registry items
   */
  async getRegistry(): Promise<RegistryItem[]> {
    try {
      const { data } = await this.client.get<RegistryItem[]>('/registry');
      return data;
    } catch (error) {
      this.handleError(error, 'Failed to fetch registry');
      throw error;
    }
  }

  /**
   * Search items
   */
  async search(query: string, kind?: string): Promise<RegistryItem[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (kind) params.append('kind', kind);

      const { data } = await this.client.get<RegistryItem[]>(`/search?${params}`);
      return data;
    } catch (error) {
      this.handleError(error, 'Search failed');
      throw error;
    }
  }

  /**
   * Handle API errors with user-friendly messages
   */
  private handleError(error: unknown, context: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 404) {
        console.error(chalk.red(`\n✗ ${context}`));
        console.error(chalk.yellow('  Item not found in the marketplace.'));
        console.error(chalk.gray('  Tip: Use `gicm search <query>` to find available items.\n'));
      } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        console.error(chalk.red(`\n✗ Cannot connect to gICM marketplace`));
        console.error(chalk.yellow('  Please check your internet connection.'));
        console.error(chalk.gray(`  API URL: ${this.baseURL}\n`));
      } else if (axiosError.code === 'ETIMEDOUT') {
        console.error(chalk.red(`\n✗ Request timed out`));
        console.error(chalk.yellow('  The marketplace API is taking too long to respond.'));
        console.error(chalk.gray('  Please try again later.\n'));
      } else {
        console.error(chalk.red(`\n✗ ${context}`));
        console.error(chalk.yellow(`  ${axiosError.message}\n`));
      }
    } else {
      console.error(chalk.red(`\n✗ ${context}`));
      console.error(chalk.yellow(`  ${error}\n`));
    }
  }
}
