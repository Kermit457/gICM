import { createHash, randomUUID } from "crypto";
import {
  type BaseHunterSource,
  type HunterConfig,
  type HuntDiscovery,
  type RawDiscovery,
} from "../types.js";

// SEC EDGAR API - 100% Free, No Auth Required
// Rate limit: 10 requests/second (must include user-agent)
const SEC_API = "https://data.sec.gov";
const SEC_SUBMISSIONS = "https://data.sec.gov/submissions";

interface SECFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate?: string;
  form: string;
  primaryDocument?: string;
  primaryDocDescription?: string;
  items?: string;
  size: number;
  isXBRL: number;
  isInlineXBRL: number;
}

interface SECCompany {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

// Key filing types we care about
const IMPORTANT_FORMS = [
  "4",      // Insider transactions
  "13F-HR", // Institutional holdings (quarterly)
  "8-K",    // Material events
  "SC 13G", // Beneficial ownership (passive)
  "SC 13D", // Beneficial ownership (active)
  "S-1",    // IPO registration
  "10-K",   // Annual report
  "10-Q",   // Quarterly report
];

// Major companies/hedge funds to track (CIK numbers)
const TRACKED_CIKS = [
  "1067983", // Berkshire Hathaway (Buffett)
  "1649339", // Bridgewater Associates
  "1350694", // Renaissance Technologies
  "1037389", // Soros Fund Management
  "1061768", // Citadel Advisors
  "1336528", // Tiger Global
  "1103804", // BlackRock
  "886982",  // Goldman Sachs
  "1166559", // JPMorgan
  "1364742", // ARK Investment
];

// Crypto-related companies to track
const CRYPTO_TICKERS = [
  "COIN", "MSTR", "RIOT", "MARA", "CLSK", "HUT", "BITF", "BTBT",
  "GBTC", "BITO", "ARKB", "IBIT",
];

export class SECHunter implements BaseHunterSource {
  source = "sec" as const;
  private config: HunterConfig;

  constructor(config: HunterConfig) {
    this.config = config;
  }

  async hunt(): Promise<RawDiscovery[]> {
    const discoveries: RawDiscovery[] = [];

    // 1. Fetch recent filings for tracked hedge funds/institutions
    for (const cik of TRACKED_CIKS.slice(0, 5)) { // Limit to stay under rate limits
      try {
        const filings = await this.fetchCompanyFilings(cik);
        const recent = this.filterRecentFilings(filings);
        discoveries.push(...recent.map((f) => this.filingToRawDiscovery(f, filings.name)));
        await new Promise((r) => setTimeout(r, 150)); // Rate limit: 10/sec
      } catch (error) {
        console.error(`[SECHunter] Failed to fetch CIK ${cik}:`, error);
      }
    }

    // 2. Fetch latest Form 4 filings (insider trades)
    try {
      const form4s = await this.fetchLatestForm4s();
      discoveries.push(...form4s);
    } catch (error) {
      console.error("[SECHunter] Failed to fetch Form 4s:", error);
    }

    // Deduplicate
    const seen = new Set<string>();
    return discoveries.filter((d) => {
      if (seen.has(d.sourceId)) return false;
      seen.add(d.sourceId);
      return true;
    });
  }

  transform(raw: RawDiscovery): HuntDiscovery {
    const text = `${raw.title} ${raw.description ?? ""}`.toLowerCase();
    const metadata = raw.metadata as { form: string; company: string } | undefined;

    return {
      id: randomUUID(),
      source: "sec" as any,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      description: raw.description,
      author: raw.author,
      authorUrl: raw.authorUrl,
      publishedAt: raw.publishedAt,
      discoveredAt: new Date(),
      category: this.categorize(metadata?.form),
      tags: this.extractTags(text, metadata),
      language: undefined,
      metrics: raw.metrics,
      relevanceFactors: {
        hasWeb3Keywords: this.isCryptoRelated(text),
        hasAIKeywords: this.hasKeywords(text, ["ai", "artificial intelligence", "machine learning"]),
        hasSolanaKeywords: this.hasKeywords(text, ["solana"]),
        hasEthereumKeywords: this.hasKeywords(text, ["ethereum"]),
        hasTypeScript: false,
        recentActivity: true,
        highEngagement: this.isHighValueFiling(metadata?.form, text),
        isShowHN: false,
      },
      rawMetadata: metadata as unknown as Record<string, unknown>,
      fingerprint: this.generateFingerprint(raw),
    };
  }

  private async fetchCompanyFilings(cik: string): Promise<SECCompany> {
    const paddedCik = cik.padStart(10, "0");
    const response = await fetch(`${SEC_SUBMISSIONS}/CIK${paddedCik}.json`, {
      headers: {
        "User-Agent": "gICM-Hunter info@gicm.io",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SEC API error: ${response.status}`);
    }

    return response.json();
  }

  private async fetchLatestForm4s(): Promise<RawDiscovery[]> {
    // SEC's daily index for latest filings
    const today = new Date();
    const year = today.getFullYear();
    const quarter = `QTR${Math.ceil((today.getMonth() + 1) / 3)}`;

    try {
      // Fetch the master index for current quarter
      const indexUrl = `https://www.sec.gov/Archives/edgar/full-index/${year}/${quarter}/master.idx`;
      const response = await fetch(indexUrl, {
        headers: {
          "User-Agent": "gICM-Hunter info@gicm.io",
        },
      });

      if (!response.ok) return [];

      const text = await response.text();
      const lines = text.split("\n").filter((l) => l.includes("|4|"));

      // Get last 50 Form 4 filings
      const recentForm4s = lines.slice(-50);
      const discoveries: RawDiscovery[] = [];

      for (const line of recentForm4s) {
        const parts = line.split("|");
        if (parts.length >= 5) {
          const [cik, company, form, date, path] = parts;

          // Filter for crypto or major companies
          if (this.isInterestingCompany(company)) {
            discoveries.push({
              sourceId: `sec:form4:${path.trim()}`,
              sourceUrl: `https://www.sec.gov/Archives/${path.trim()}`,
              title: `[INSIDER] ${company.trim()} - Form 4 Filed`,
              description: `Insider transaction reported for ${company.trim()}. Check for buys/sells.`,
              author: company.trim(),
              publishedAt: new Date(date),
              metrics: {
                points: 1,
              },
              metadata: { form: "4", company: company.trim(), cik, date } as unknown as Record<string, unknown>,
            });
          }
        }
      }

      return discoveries;
    } catch (error) {
      console.error("[SECHunter] Form 4 index fetch failed:", error);
      return [];
    }
  }

  private filterRecentFilings(company: SECCompany): SECFiling[] {
    const filings = company.filings.recent;
    const results: SECFiling[] = [];

    // Get filings from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (let i = 0; i < Math.min(filings.accessionNumber.length, 20); i++) {
      const form = filings.form[i];
      const filingDate = new Date(filings.filingDate[i]);

      if (filingDate < sevenDaysAgo) continue;
      if (!IMPORTANT_FORMS.includes(form)) continue;

      results.push({
        accessionNumber: filings.accessionNumber[i],
        filingDate: filings.filingDate[i],
        reportDate: filings.reportDate[i],
        form: form,
        primaryDocument: filings.primaryDocument[i],
        primaryDocDescription: filings.primaryDocDescription[i],
        size: 0,
        isXBRL: 0,
        isInlineXBRL: 0,
      });
    }

    return results;
  }

  private filingToRawDiscovery(filing: SECFiling, companyName: string): RawDiscovery {
    const formType = this.getFormDescription(filing.form);
    const emoji = this.getFormEmoji(filing.form);

    return {
      sourceId: `sec:${filing.accessionNumber}`,
      sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${companyName}&type=${filing.form}&dateb=&owner=include&count=10`,
      title: `${emoji} [${filing.form}] ${companyName} - ${formType}`,
      description: filing.primaryDocDescription || `${formType} filed on ${filing.filingDate}`,
      author: companyName,
      authorUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(companyName)}`,
      publishedAt: new Date(filing.filingDate),
      metrics: {
        points: this.getFormImportance(filing.form),
      },
      metadata: { ...filing, company: companyName } as unknown as Record<string, unknown>,
    };
  }

  private getFormDescription(form: string): string {
    const descriptions: Record<string, string> = {
      "4": "Insider Transaction",
      "13F-HR": "Institutional Holdings Report",
      "8-K": "Material Event",
      "SC 13G": "Beneficial Ownership (Passive)",
      "SC 13D": "Beneficial Ownership (Active)",
      "S-1": "IPO Registration",
      "10-K": "Annual Report",
      "10-Q": "Quarterly Report",
    };
    return descriptions[form] || form;
  }

  private getFormEmoji(form: string): string {
    const emojis: Record<string, string> = {
      "4": "👤",
      "13F-HR": "🏦",
      "8-K": "⚡",
      "SC 13G": "📊",
      "SC 13D": "🎯",
      "S-1": "🚀",
      "10-K": "📑",
      "10-Q": "📋",
    };
    return emojis[form] || "📄";
  }

  private getFormImportance(form: string): number {
    const importance: Record<string, number> = {
      "SC 13D": 10, // Active ownership = big moves
      "13F-HR": 9,  // Institutional holdings
      "4": 8,       // Insider trades
      "8-K": 7,     // Material events
      "S-1": 6,     // IPOs
      "SC 13G": 5,  // Passive ownership
      "10-K": 4,
      "10-Q": 3,
    };
    return importance[form] || 1;
  }

  private categorize(form?: string): HuntDiscovery["category"] {
    if (form === "4" || form === "SC 13D" || form === "SC 13G") return "other";
    if (form === "13F-HR") return "other";
    return "other";
  }

  private extractTags(text: string, metadata?: { form: string; company: string }): string[] {
    const tags = ["sec", "filing"];

    if (metadata?.form) {
      tags.push(metadata.form.toLowerCase().replace(/[^a-z0-9]/g, ""));
      if (metadata.form === "4") tags.push("insider-trade");
      if (metadata.form === "13F-HR") tags.push("institutional");
    }

    if (this.isCryptoRelated(text)) tags.push("crypto");
    if (this.hasKeywords(text, ["berkshire", "buffett"])) tags.push("buffett");
    if (this.hasKeywords(text, ["blackrock", "ishares"])) tags.push("blackrock");

    return tags;
  }

  private isCryptoRelated(text: string): boolean {
    const cryptoKeywords = [
      "bitcoin", "btc", "ethereum", "eth", "crypto", "blockchain",
      "coinbase", "microstrategy", "riot", "marathon", "cleanspark",
      "grayscale", "bitwise", "ark",
    ];
    return cryptoKeywords.some((kw) => text.toLowerCase().includes(kw));
  }

  private isInterestingCompany(company: string): boolean {
    const lowerCompany = company.toLowerCase();

    // Check crypto tickers
    if (CRYPTO_TICKERS.some((t) => lowerCompany.includes(t.toLowerCase()))) return true;

    // Check for major tech/finance
    const interestingKeywords = [
      "apple", "microsoft", "google", "amazon", "nvidia", "meta", "tesla",
      "coinbase", "microstrategy", "blackrock", "fidelity", "vanguard",
      "goldman", "jpmorgan", "morgan stanley",
    ];

    return interestingKeywords.some((kw) => lowerCompany.includes(kw));
  }

  private isHighValueFiling(form?: string, text?: string): boolean {
    if (!form) return false;
    if (["SC 13D", "13F-HR", "4"].includes(form)) return true;
    if (form === "8-K" && text?.toLowerCase().includes("acquisition")) return true;
    return false;
  }

  private hasKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  }

  private generateFingerprint(raw: RawDiscovery): string {
    const key = `sec:${raw.sourceId}`;
    return createHash("sha256").update(key).digest("hex").slice(0, 32);
  }
}
