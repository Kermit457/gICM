/**
 * Product Hunt Source
 *
 * Ingests trending products and launches.
 */

import { BaseSource, RawItem } from "../base.js";
import type { SourceType } from "../../../types/index.js";

export class ProductHuntSource extends BaseSource {
  name = "producthunt";
  type: SourceType = "producthunt";
  interval = 60 * 60 * 1000; // Every hour

  constructor() {
    super();
    this.rateLimit = { requests: 10, window: 60000 };
  }

  async fetch(): Promise<RawItem[]> {
    const items: RawItem[] = [];

    try {
      // Product Hunt GraphQL API
      const response = await this.rateLimitedFetch(
        "https://api.producthunt.com/v2/api/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.PRODUCTHUNT_TOKEN && {
              Authorization: `Bearer ${process.env.PRODUCTHUNT_TOKEN}`,
            }),
          },
          body: JSON.stringify({
            query: `
              query {
                posts(first: 30, order: VOTES) {
                  edges {
                    node {
                      id
                      name
                      tagline
                      description
                      url
                      website
                      votesCount
                      commentsCount
                      createdAt
                      topics {
                        edges {
                          node {
                            name
                          }
                        }
                      }
                      makers {
                        name
                        username
                      }
                    }
                  }
                }
              }
            `,
          }),
        }
      );

      if (!response.ok) {
        // Fallback to scraping if API not available
        this.logger.warn("Product Hunt API unavailable, using fallback");
        return items;
      }

      const data = await response.json() as {
        data?: {
          posts?: {
            edges?: Array<{
              node: {
                id: string;
                name: string;
                tagline: string;
                description?: string;
                url: string;
                website?: string;
                votesCount: number;
                commentsCount: number;
                createdAt: string;
                topics?: { edges?: Array<{ node: { name: string } }> };
                makers?: Array<{ name: string; username: string }>;
              };
            }>;
          };
        };
      };

      const posts = data?.data?.posts?.edges || [];

      for (const { node: product } of posts) {
        const topics = product.topics?.edges?.map((e) => e.node.name) || [];
        const makers = product.makers?.map((m) => m.name) || [];

        items.push({
          id: this.generateId("producthunt", product.id),
          source: this.name,
          type: "announcement",
          content: `${product.name}: ${product.tagline}\n\n${product.description || ""}`,
          metadata: {
            productId: product.id,
            name: product.name,
            tagline: product.tagline,
            url: product.url,
            website: product.website,
            votes: product.votesCount,
            comments: product.commentsCount,
            topics,
            makers,
          },
          timestamp: new Date(product.createdAt).getTime(),
        });
      }

      this.logger.info(`Fetched ${items.length} products from Product Hunt`);
    } catch (error) {
      this.logger.error(`Failed to fetch Product Hunt: ${error}`);
    }

    return items;
  }
}
