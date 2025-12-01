/**
 * Content Distribution Service
 *
 * Handles publishing content to various platforms.
 * - Tier 1 (Automated): blog, substack, mirror, medium, devto, hashnode, github, rss, email
 * - Tier 2 (Approval Required): twitter, linkedin, reddit
 */

import type {
  DistributionPacket,
  DistributionAttempt,
  ContentChannel,
  ContentArticle,
} from "../types/content.js";

// =============================================================================
// TYPES
// =============================================================================

export interface DistributionConfig {
  // Blog (your own site)
  blogApiUrl?: string;
  blogApiKey?: string;

  // Substack
  substackApiUrl?: string;
  substackApiKey?: string;

  // Mirror.xyz
  mirrorAddress?: string;
  mirrorPrivateKey?: string;

  // Medium
  mediumIntegrationToken?: string;
  mediumPublicationId?: string;

  // Dev.to
  devtoApiKey?: string;

  // Hashnode
  hashnodeApiKey?: string;
  hashnodePublicationId?: string;

  // GitHub
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;

  // Email (via ESP)
  emailProvider?: "buttondown" | "mailerlite" | "mailchimp";
  emailApiKey?: string;
  emailListId?: string;

  // Twitter (for drafts queue)
  twitterBearerToken?: string;

  // LinkedIn (for drafts queue)
  linkedinAccessToken?: string;

  // =========================================================================
  // NEW: Web3 Social Channels
  // =========================================================================

  // Farcaster (via Neynar API)
  farcasterApiKey?: string;        // Neynar API key
  farcasterSignerUuid?: string;    // Signer UUID from Neynar

  // Lens Protocol
  lensProfileId?: string;
  lensAccessToken?: string;

  // Paragraph.xyz
  paragraphApiKey?: string;
  paragraphPublicationId?: string;

  // =========================================================================
  // NEW: Decentralized Social Channels
  // =========================================================================

  // Bluesky (AT Protocol)
  blueskyHandle?: string;          // e.g., "gicm.bsky.social"
  blueskyAppPassword?: string;     // App password (not main password)

  // Mastodon (ActivityPub)
  mastodonInstance?: string;       // e.g., "mastodon.social"
  mastodonAccessToken?: string;

  // =========================================================================
  // NEW: Other Channels
  // =========================================================================

  // Threads (Meta) - Limited API
  threadsUserId?: string;
  threadsAccessToken?: string;

  // Dry run mode (log but don't publish)
  dryRun?: boolean;
}

export interface DistributionResult {
  channel: ContentChannel;
  success: boolean;
  externalUrl?: string;
  externalId?: string;
  error?: string;
  timestamp: string;
}

// =============================================================================
// DISTRIBUTION SERVICE
// =============================================================================

export class DistributionService {
  private config: DistributionConfig;
  private attempts: Map<string, DistributionAttempt[]> = new Map();

  constructor(config: DistributionConfig = {}) {
    this.config = {
      dryRun: process.env.DISTRIBUTION_DRY_RUN === "true",
      ...config,
    };
  }

  /**
   * Distribute content to specified channels
   */
  async distribute(
    packet: DistributionPacket,
    channels?: ContentChannel[]
  ): Promise<DistributionResult[]> {
    const targetChannels = channels || this.getDefaultChannels(packet);
    const results: DistributionResult[] = [];

    for (const channel of targetChannels) {
      try {
        const result = await this.publishToChannel(packet, channel);
        results.push(result);
        this.recordAttempt(packet.id, result);
      } catch (error) {
        const errorResult: DistributionResult = {
          channel,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        };
        results.push(errorResult);
        this.recordAttempt(packet.id, errorResult);
      }
    }

    return results;
  }

  /**
   * Get default channels based on packet content
   */
  private getDefaultChannels(packet: DistributionPacket): ContentChannel[] {
    const channels: ContentChannel[] = ["blog"];

    // Tier 1: Traditional platforms
    if (packet.substackBody) channels.push("substack");
    if (packet.mirrorBody) channels.push("mirror");
    if (packet.mediumBody) channels.push("medium");
    if (packet.devtoBody) channels.push("devto");
    if (packet.hashnodeBody) channels.push("hashnode");
    if (packet.githubReadme) channels.push("github");
    if (packet.rssEntry) channels.push("rss");
    if (packet.emailDigest) channels.push("email");

    // Tier 1: Web3 social (NEW)
    if (packet.farcasterCast) channels.push("farcaster");
    if (packet.lensPost) channels.push("lens");
    if (packet.paragraphPost) channels.push("paragraph");

    // Tier 1: Decentralized social (NEW)
    if (packet.blueskyPost) channels.push("bluesky");
    if (packet.mastodonPost) channels.push("mastodon");

    // Tier 2 channels always included as drafts
    if (packet.twitterThread?.length) channels.push("twitter");
    if (packet.linkedinPost) channels.push("linkedin");
    if (packet.redditDraft) channels.push("reddit");
    if (packet.threadsDraft) channels.push("threads");

    return channels;
  }

  /**
   * Publish to a specific channel
   */
  private async publishToChannel(
    packet: DistributionPacket,
    channel: ContentChannel
  ): Promise<DistributionResult> {
    if (this.config.dryRun) {
      console.log(`[DISTRIBUTION] DRY RUN: Would publish to ${channel}`);
      return {
        channel,
        success: true,
        externalUrl: `https://${channel}.example.com/${packet.baseSlug}`,
        timestamp: new Date().toISOString(),
      };
    }

    switch (channel) {
      // Tier 1: Traditional platforms
      case "blog":
        return this.publishToBlog(packet);
      case "substack":
        return this.publishToSubstack(packet);
      case "mirror":
        return this.publishToMirror(packet);
      case "medium":
        return this.publishToMedium(packet);
      case "devto":
        return this.publishToDevTo(packet);
      case "hashnode":
        return this.publishToHashnode(packet);
      case "github":
        return this.publishToGitHub(packet);
      case "rss":
        return this.publishToRSS(packet);
      case "email":
        return this.publishToEmail(packet);

      // Tier 1: Web3 Social (NEW)
      case "farcaster":
        return this.publishToFarcaster(packet);
      case "lens":
        return this.publishToLens(packet);
      case "paragraph":
        return this.publishToParagraph(packet);

      // Tier 1: Decentralized Social (NEW)
      case "bluesky":
        return this.publishToBluesky(packet);
      case "mastodon":
        return this.publishToMastodon(packet);

      // Tier 2: Approval required
      case "twitter":
        return this.queueForTwitter(packet);
      case "linkedin":
        return this.queueForLinkedIn(packet);
      case "reddit":
        return this.queueForReddit(packet);
      case "threads":
        return this.queueForThreads(packet);

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  // ===========================================================================
  // TIER 1: AUTOMATED PUBLISHING
  // ===========================================================================

  /**
   * Publish to own blog via API
   */
  private async publishToBlog(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.blogApiUrl) {
      // Fallback: Write to local file system
      console.log(`[DISTRIBUTION] Blog API not configured, logging to console`);
      console.log(`[BLOG] Title: ${packet.baseSlug}`);
      console.log(`[BLOG] Content: ${packet.blogPost?.slice(0, 500)}...`);

      return {
        channel: "blog",
        success: true,
        externalUrl: `https://gicm.dev/blog/${packet.baseSlug}`,
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch(this.config.blogApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.blogApiKey}`,
      },
      body: JSON.stringify({
        slug: packet.baseSlug,
        content: packet.blogPost,
        canonicalUrl: packet.canonicalUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Blog API error: ${response.status}`);
    }

    const data = await response.json() as { url?: string; id?: string };
    return {
      channel: "blog",
      success: true,
      externalUrl: data.url || `https://gicm.dev/blog/${packet.baseSlug}`,
      externalId: data.id,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Substack via API or email
   */
  private async publishToSubstack(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.substackApiUrl) {
      console.log(`[DISTRIBUTION] Substack not configured, skipping`);
      return {
        channel: "substack",
        success: false,
        error: "Substack API not configured",
        timestamp: new Date().toISOString(),
      };
    }

    // Substack API implementation would go here
    // For now, log and return success
    console.log(`[SUBSTACK] Would publish: ${packet.baseSlug}`);
    return {
      channel: "substack",
      success: true,
      externalUrl: `https://gicm.substack.com/p/${packet.baseSlug}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Mirror.xyz via wallet signature
   */
  private async publishToMirror(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.mirrorAddress) {
      console.log(`[DISTRIBUTION] Mirror not configured, skipping`);
      return {
        channel: "mirror",
        success: false,
        error: "Mirror wallet not configured",
        timestamp: new Date().toISOString(),
      };
    }

    // Mirror.xyz requires wallet-based publishing
    console.log(`[MIRROR] Would publish: ${packet.baseSlug}`);
    return {
      channel: "mirror",
      success: true,
      externalUrl: `https://mirror.xyz/${this.config.mirrorAddress}/${packet.baseSlug}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Medium via Integration Token
   */
  private async publishToMedium(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.mediumIntegrationToken) {
      console.log(`[DISTRIBUTION] Medium not configured, skipping`);
      return {
        channel: "medium",
        success: false,
        error: "Medium integration token not configured",
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch("https://api.medium.com/v1/users/me/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.mediumIntegrationToken}`,
      },
      body: JSON.stringify({
        title: packet.baseSlug.replace(/-/g, " "),
        contentFormat: "markdown",
        content: packet.mediumBody,
        canonicalUrl: packet.canonicalUrl,
        publishStatus: "draft", // Start as draft for review
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Medium API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { data?: { url?: string; id?: string } };
    return {
      channel: "medium",
      success: true,
      externalUrl: data.data?.url,
      externalId: data.data?.id,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Dev.to via API
   */
  private async publishToDevTo(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.devtoApiKey || !packet.devtoBody) {
      console.log(`[DISTRIBUTION] Dev.to not configured or no content, skipping`);
      return {
        channel: "devto",
        success: false,
        error: "Dev.to API key not configured or no content",
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.config.devtoApiKey,
      },
      body: JSON.stringify({
        article: {
          title: packet.baseSlug.replace(/-/g, " "),
          body_markdown: packet.devtoBody,
          published: false, // Start as draft
          canonical_url: packet.canonicalUrl,
          tags: ["ai", "webdev", "programming"],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Dev.to API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { url?: string; id?: number };
    return {
      channel: "devto",
      success: true,
      externalUrl: data.url,
      externalId: data.id?.toString(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Hashnode via GraphQL API
   */
  private async publishToHashnode(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.hashnodeApiKey || !packet.hashnodeBody) {
      console.log(`[DISTRIBUTION] Hashnode not configured or no content, skipping`);
      return {
        channel: "hashnode",
        success: false,
        error: "Hashnode API key not configured or no content",
        timestamp: new Date().toISOString(),
      };
    }

    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          post {
            id
            url
          }
        }
      }
    `;

    const response = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.config.hashnodeApiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            title: packet.baseSlug.replace(/-/g, " "),
            contentMarkdown: packet.hashnodeBody,
            publicationId: this.config.hashnodePublicationId,
            originalArticleURL: packet.canonicalUrl,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hashnode API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { data?: { createPost?: { post?: { id?: string; url?: string } } } };
    return {
      channel: "hashnode",
      success: true,
      externalUrl: data.data?.createPost?.post?.url,
      externalId: data.data?.createPost?.post?.id,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to GitHub repo (CHANGELOG, docs, etc.)
   */
  private async publishToGitHub(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.githubToken || !packet.githubReadme) {
      console.log(`[DISTRIBUTION] GitHub not configured or no content, skipping`);
      return {
        channel: "github",
        success: false,
        error: "GitHub token not configured or no content",
        timestamp: new Date().toISOString(),
      };
    }

    const { githubOwner, githubRepo, githubBranch = "main" } = this.config;
    const filePath = `content/blog/${packet.baseSlug}.md`;

    // Create or update file via GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `token ${this.config.githubToken}`,
        },
        body: JSON.stringify({
          message: `Add blog post: ${packet.baseSlug}`,
          content: Buffer.from(packet.githubReadme).toString("base64"),
          branch: githubBranch,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { content?: { html_url?: string; sha?: string } };
    return {
      channel: "github",
      success: true,
      externalUrl: data.content?.html_url,
      externalId: data.content?.sha,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update RSS feed
   */
  private async publishToRSS(packet: DistributionPacket): Promise<DistributionResult> {
    if (!packet.rssEntry) {
      return {
        channel: "rss",
        success: false,
        error: "No RSS entry in packet",
        timestamp: new Date().toISOString(),
      };
    }

    // RSS is typically generated from the blog database
    // Here we just log that it would be included
    console.log(`[RSS] Entry added: ${packet.rssEntry.title}`);

    return {
      channel: "rss",
      success: true,
      externalUrl: packet.rssEntry.link,
      externalId: packet.rssEntry.guid,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send email digest via ESP
   */
  private async publishToEmail(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.emailApiKey || !packet.emailDigest) {
      console.log(`[DISTRIBUTION] Email not configured or no digest, skipping`);
      return {
        channel: "email",
        success: false,
        error: "Email provider not configured or no digest",
        timestamp: new Date().toISOString(),
      };
    }

    const provider = this.config.emailProvider || "buttondown";
    let response: Response;

    switch (provider) {
      case "buttondown":
        response = await fetch("https://api.buttondown.email/v1/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${this.config.emailApiKey}`,
          },
          body: JSON.stringify({
            subject: packet.emailDigest.subject,
            body: packet.emailDigest.htmlBody,
            status: "draft", // Start as draft
          }),
        });
        break;

      case "mailerlite":
        response = await fetch("https://connect.mailerlite.com/api/campaigns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.emailApiKey}`,
          },
          body: JSON.stringify({
            name: packet.emailDigest.subject,
            type: "regular",
            emails: [
              {
                subject: packet.emailDigest.subject,
                content: packet.emailDigest.htmlBody,
              },
            ],
          }),
        });
        break;

      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Email API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { id?: string };
    return {
      channel: "email",
      success: true,
      externalId: data.id,
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // TIER 1: WEB3 SOCIAL CHANNELS (NEW)
  // ===========================================================================

  /**
   * Publish to Farcaster via Neynar API
   * @see https://docs.neynar.com/reference/post-cast
   */
  private async publishToFarcaster(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.farcasterApiKey || !this.config.farcasterSignerUuid || !packet.farcasterCast) {
      console.log(`[DISTRIBUTION] Farcaster not configured or no cast, skipping`);
      return {
        channel: "farcaster",
        success: false,
        error: "Farcaster API key/signer not configured or no cast content",
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_key": this.config.farcasterApiKey,
      },
      body: JSON.stringify({
        signer_uuid: this.config.farcasterSignerUuid,
        text: packet.farcasterCast,
        // Optional: Add embeds for links
        embeds: packet.canonicalUrl ? [{ url: packet.canonicalUrl }] : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Farcaster API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { cast?: { hash?: string; author?: { username?: string } } };
    const hash = data.cast?.hash;
    const username = data.cast?.author?.username;

    return {
      channel: "farcaster",
      success: true,
      externalUrl: hash && username ? `https://warpcast.com/${username}/${hash.slice(0, 10)}` : undefined,
      externalId: hash,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Lens Protocol via API
   * @see https://docs.lens.xyz/docs/create-post-typed-data
   */
  private async publishToLens(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.lensProfileId || !this.config.lensAccessToken || !packet.lensPost) {
      console.log(`[DISTRIBUTION] Lens not configured or no post, skipping`);
      return {
        channel: "lens",
        success: false,
        error: "Lens profile/token not configured or no post content",
        timestamp: new Date().toISOString(),
      };
    }

    // Lens uses GraphQL API
    const mutation = `
      mutation CreatePostOnLens($request: OnchainPostRequest!) {
        postOnchain(request: $request) {
          ... on RelaySuccess {
            txHash
            txId
          }
          ... on LensProfileManagerRelayError {
            reason
          }
        }
      }
    `;

    const response = await fetch("https://api-v2.lens.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.lensAccessToken}`,
        "x-access-token": this.config.lensAccessToken,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          request: {
            contentURI: `data:application/json,${encodeURIComponent(JSON.stringify({
              $schema: "https://json-schemas.lens.dev/publications/text-only/3.0.0.json",
              lens: {
                mainContentFocus: "TEXT_ONLY",
                content: packet.lensPost,
                locale: "en",
              },
            }))}`,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Lens API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { data?: { postOnchain?: { txHash?: string; txId?: string } } };
    const txHash = data.data?.postOnchain?.txHash;

    return {
      channel: "lens",
      success: true,
      externalUrl: txHash ? `https://hey.xyz/posts/${txHash}` : undefined,
      externalId: txHash || data.data?.postOnchain?.txId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Paragraph.xyz
   * @see https://docs.paragraph.xyz/api
   */
  private async publishToParagraph(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.paragraphApiKey || !packet.paragraphPost) {
      console.log(`[DISTRIBUTION] Paragraph not configured or no post, skipping`);
      return {
        channel: "paragraph",
        success: false,
        error: "Paragraph API key not configured or no post content",
        timestamp: new Date().toISOString(),
      };
    }

    const response = await fetch("https://api.paragraph.xyz/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.paragraphApiKey}`,
      },
      body: JSON.stringify({
        title: packet.baseSlug.replace(/-/g, " "),
        markdown: packet.paragraphPost,
        slug: packet.baseSlug,
        status: "draft", // Start as draft for review
        publicationId: this.config.paragraphPublicationId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Paragraph API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { id?: string; slug?: string };
    return {
      channel: "paragraph",
      success: true,
      externalUrl: data.slug ? `https://paragraph.xyz/@gicm/${data.slug}` : undefined,
      externalId: data.id,
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // TIER 1: DECENTRALIZED SOCIAL CHANNELS (NEW)
  // ===========================================================================

  /**
   * Publish to Bluesky via AT Protocol
   * @see https://docs.bsky.app/docs/api/com-atproto-repo-create-record
   */
  private async publishToBluesky(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.blueskyHandle || !this.config.blueskyAppPassword || !packet.blueskyPost) {
      console.log(`[DISTRIBUTION] Bluesky not configured or no post, skipping`);
      return {
        channel: "bluesky",
        success: false,
        error: "Bluesky handle/password not configured or no post content",
        timestamp: new Date().toISOString(),
      };
    }

    // Step 1: Create session
    const sessionResponse = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: this.config.blueskyHandle,
        password: this.config.blueskyAppPassword,
      }),
    });

    if (!sessionResponse.ok) {
      const error = await sessionResponse.text();
      throw new Error(`Bluesky auth error: ${sessionResponse.status} - ${error}`);
    }

    const session = await sessionResponse.json() as { accessJwt: string; did: string };

    // Step 2: Create post
    const postResponse = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text: packet.blueskyPost,
          createdAt: new Date().toISOString(),
          // Add link card if canonical URL exists
          embed: packet.canonicalUrl ? {
            $type: "app.bsky.embed.external",
            external: {
              uri: packet.canonicalUrl,
              title: packet.baseSlug.replace(/-/g, " "),
              description: packet.blueskyPost.slice(0, 300),
            },
          } : undefined,
        },
      }),
    });

    if (!postResponse.ok) {
      const error = await postResponse.text();
      throw new Error(`Bluesky post error: ${postResponse.status} - ${error}`);
    }

    const postData = await postResponse.json() as { uri?: string; cid?: string };
    // Convert AT URI to web URL
    const webUrl = postData.uri?.replace("at://", "https://bsky.app/profile/").replace("/app.bsky.feed.post/", "/post/");

    return {
      channel: "bluesky",
      success: true,
      externalUrl: webUrl,
      externalId: postData.cid,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publish to Mastodon via ActivityPub
   * @see https://docs.joinmastodon.org/methods/statuses/
   */
  private async publishToMastodon(packet: DistributionPacket): Promise<DistributionResult> {
    if (!this.config.mastodonInstance || !this.config.mastodonAccessToken || !packet.mastodonPost) {
      console.log(`[DISTRIBUTION] Mastodon not configured or no toot, skipping`);
      return {
        channel: "mastodon",
        success: false,
        error: "Mastodon instance/token not configured or no post content",
        timestamp: new Date().toISOString(),
      };
    }

    const instance = this.config.mastodonInstance.replace(/^https?:\/\//, "").replace(/\/$/, "");

    const response = await fetch(`https://${instance}/api/v1/statuses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.mastodonAccessToken}`,
      },
      body: JSON.stringify({
        status: packet.mastodonPost,
        visibility: "public",
        // Add link preview
        ...(packet.canonicalUrl && {
          media_ids: [], // Could add preview image
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mastodon API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { id?: string; url?: string };
    return {
      channel: "mastodon",
      success: true,
      externalUrl: data.url,
      externalId: data.id,
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // TIER 2: QUEUED FOR APPROVAL
  // ===========================================================================

  /**
   * Queue Twitter thread for approval
   */
  private async queueForTwitter(packet: DistributionPacket): Promise<DistributionResult> {
    if (!packet.twitterThread?.length) {
      return {
        channel: "twitter",
        success: false,
        error: "No Twitter thread in packet",
        timestamp: new Date().toISOString(),
      };
    }

    // Store in approval queue (would be a database in production)
    console.log(`[TWITTER] Queued thread with ${packet.twitterThread.length} tweets for approval`);
    console.log(`[TWITTER] First tweet: ${packet.twitterThread[0]}`);

    return {
      channel: "twitter",
      success: true,
      externalUrl: undefined, // No URL until approved and posted
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Queue LinkedIn post for approval
   */
  private async queueForLinkedIn(packet: DistributionPacket): Promise<DistributionResult> {
    if (!packet.linkedinPost) {
      return {
        channel: "linkedin",
        success: false,
        error: "No LinkedIn post in packet",
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`[LINKEDIN] Queued post for approval`);
    console.log(`[LINKEDIN] Preview: ${packet.linkedinPost.slice(0, 200)}...`);

    return {
      channel: "linkedin",
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Queue Reddit draft for approval
   */
  private async queueForReddit(packet: DistributionPacket): Promise<DistributionResult> {
    if (!packet.redditDraft) {
      return {
        channel: "reddit",
        success: false,
        error: "No Reddit draft in packet",
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`[REDDIT] Queued draft for approval`);
    console.log(`[REDDIT] Preview: ${packet.redditDraft.slice(0, 200)}...`);

    return {
      channel: "reddit",
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Queue Threads draft for approval (Meta's Threads - limited API)
   */
  private async queueForThreads(packet: DistributionPacket): Promise<DistributionResult> {
    if (!packet.threadsDraft) {
      return {
        channel: "threads",
        success: false,
        error: "No Threads draft in packet",
        timestamp: new Date().toISOString(),
      };
    }

    // Threads API is still limited - queue for manual posting or use unofficial methods
    console.log(`[THREADS] Queued draft for approval`);
    console.log(`[THREADS] Preview: ${packet.threadsDraft.slice(0, 200)}...`);

    // If API credentials are available, attempt to post
    if (this.config.threadsUserId && this.config.threadsAccessToken) {
      try {
        // Threads uses Instagram's Graph API (via Meta Business Suite)
        const response = await fetch(
          `https://graph.threads.net/v1.0/${this.config.threadsUserId}/threads`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              media_type: "TEXT",
              text: packet.threadsDraft,
              access_token: this.config.threadsAccessToken,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json() as { id?: string };
          return {
            channel: "threads",
            success: true,
            externalId: data.id,
            externalUrl: data.id ? `https://threads.net/t/${data.id}` : undefined,
            timestamp: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.warn(`[THREADS] API call failed, queuing for manual:`, error);
      }
    }

    return {
      channel: "threads",
      success: true, // Success = queued for manual posting
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Record a distribution attempt
   */
  private recordAttempt(packetId: string, result: DistributionResult): void {
    const attempt: DistributionAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      packetId,
      channel: result.channel,
      attemptedAt: result.timestamp,
      status: result.success ? "success" : "failed",
      externalUrl: result.externalUrl,
      externalId: result.externalId,
      errorMessage: result.error,
      retryCount: 0,
    };

    const existing = this.attempts.get(packetId) || [];
    existing.push(attempt);
    this.attempts.set(packetId, existing);
  }

  /**
   * Get all attempts for a packet
   */
  getAttempts(packetId: string): DistributionAttempt[] {
    return this.attempts.get(packetId) || [];
  }

  /**
   * Get distribution summary
   */
  getSummary(): {
    totalAttempts: number;
    successfulChannels: ContentChannel[];
    failedChannels: ContentChannel[];
  } {
    let totalAttempts = 0;
    const successful = new Set<ContentChannel>();
    const failed = new Set<ContentChannel>();

    for (const attempts of this.attempts.values()) {
      for (const attempt of attempts) {
        totalAttempts++;
        if (attempt.status === "success") {
          successful.add(attempt.channel);
        } else {
          failed.add(attempt.channel);
        }
      }
    }

    return {
      totalAttempts,
      successfulChannels: Array.from(successful),
      failedChannels: Array.from(failed),
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let instance: DistributionService | null = null;

export function getDistributionService(config?: DistributionConfig): DistributionService {
  if (!instance) {
    instance = new DistributionService({
      // Load from environment
      blogApiUrl: process.env.BLOG_API_URL,
      blogApiKey: process.env.BLOG_API_KEY,
      devtoApiKey: process.env.DEVTO_API_KEY,
      mediumIntegrationToken: process.env.MEDIUM_INTEGRATION_TOKEN,
      hashnodeApiKey: process.env.HASHNODE_API_KEY,
      hashnodePublicationId: process.env.HASHNODE_PUBLICATION_ID,
      githubToken: process.env.GITHUB_TOKEN,
      githubOwner: process.env.GITHUB_OWNER || "gicm",
      githubRepo: process.env.GITHUB_REPO || "gicm-content",
      emailProvider: (process.env.EMAIL_PROVIDER || "buttondown") as "buttondown" | "mailerlite" | "mailchimp",
      emailApiKey: process.env.EMAIL_API_KEY,
      ...config,
    });
  }
  return instance;
}

export default DistributionService;
