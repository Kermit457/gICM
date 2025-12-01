import "dotenv/config";
import { DeFiLlamaHunter } from "./src/sources/defillama-hunter.js";
import { GeckoTerminalHunter } from "./src/sources/geckoterminal-hunter.js";
import { FearGreedHunter } from "./src/sources/feargreed-hunter.js";
import { BinanceHunter } from "./src/sources/binance-hunter.js";
import { SECHunter } from "./src/sources/sec-hunter.js";
import { FREDHunter } from "./src/sources/fred-hunter.js";
import { FinnhubHunter } from "./src/sources/finnhub-hunter.js";
import { NPMHunter } from "./src/sources/npm-hunter.js";
import type { HunterConfig } from "./src/types.js";

const createConfig = (source: string, apiKey?: string): HunterConfig => ({
  source: source as any,
  enabled: true,
  apiKey,
});

async function testHunter(
  name: string,
  hunter: { hunt: () => Promise<any[]>; transform: (raw: any) => any }
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log("=".repeat(60));

  try {
    const startTime = Date.now();
    const rawDiscoveries = await hunter.hunt();
    const elapsed = Date.now() - startTime;

    console.log(`Raw discoveries: ${rawDiscoveries.length}`);
    console.log(`Time: ${elapsed}ms`);

    if (rawDiscoveries.length > 0) {
      console.log("\nSample discoveries:");
      const samples = rawDiscoveries.slice(0, 3);
      for (const raw of samples) {
        const transformed = hunter.transform(raw);
        console.log(`  - ${transformed.title.slice(0, 80)}...`);
        if (transformed.description) {
          console.log(`    ${transformed.description.slice(0, 60)}...`);
        }
        console.log(`    Tags: ${transformed.tags.join(", ")}`);
      }
    }

    return { name, success: true, count: rawDiscoveries.length, elapsed };
  } catch (error) {
    console.error(`ERROR: ${error}`);
    return { name, success: false, error: String(error) };
  }
}

async function main() {
  console.log("Testing All New Hunters");
  console.log("=".repeat(60));
  console.log(`FRED_API_KEY: ${process.env.FRED_API_KEY ? "SET" : "NOT SET"}`);
  console.log(`FINNHUB_API_KEY: ${process.env.FINNHUB_API_KEY ? "SET" : "NOT SET"}`);

  const results: any[] = [];

  // Test FREE sources first (no API key required)
  console.log("\n\n### FREE SOURCES (No API Key) ###");

  // DeFiLlama - FREE
  results.push(
    await testHunter("DeFiLlama", new DeFiLlamaHunter(createConfig("defillama")))
  );

  // Fear & Greed - FREE
  results.push(
    await testHunter("Fear & Greed", new FearGreedHunter(createConfig("feargreed")))
  );

  // Binance - FREE
  results.push(
    await testHunter("Binance", new BinanceHunter(createConfig("binance")))
  );

  // SEC EDGAR - FREE
  results.push(
    await testHunter("SEC EDGAR", new SECHunter(createConfig("sec")))
  );

  // GeckoTerminal - FREE (but slow due to rate limits)
  console.log("\n[GeckoTerminal is slow due to 30/min rate limit - testing...]");
  results.push(
    await testHunter("GeckoTerminal", new GeckoTerminalHunter(createConfig("geckoterminal")))
  );

  // npm - FREE
  results.push(
    await testHunter("npm", new NPMHunter(createConfig("npm")))
  );

  // Test API-KEY sources
  console.log("\n\n### API KEY REQUIRED SOURCES ###");

  // FRED - needs API key
  if (process.env.FRED_API_KEY) {
    results.push(
      await testHunter(
        "FRED",
        new FREDHunter(createConfig("fred", process.env.FRED_API_KEY))
      )
    );
  } else {
    console.log("\nFRED: SKIPPED (no FRED_API_KEY set)");
    console.log("  Get free key at: https://fred.stlouisfed.org/docs/api/api_key.html");
    results.push({ name: "FRED", success: false, error: "No API key" });
  }

  // Finnhub - needs API key
  if (process.env.FINNHUB_API_KEY) {
    results.push(
      await testHunter(
        "Finnhub",
        new FinnhubHunter(createConfig("finnhub", process.env.FINNHUB_API_KEY))
      )
    );
  } else {
    console.log("\nFinnhub: SKIPPED (no FINNHUB_API_KEY set)");
    console.log("  Get free key at: https://finnhub.io/register");
    results.push({ name: "Finnhub", success: false, error: "No API key" });
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  for (const result of results) {
    const status = result.success ? "OK" : "FAIL";
    const info = result.success
      ? `${result.count} discoveries in ${result.elapsed}ms`
      : result.error;
    console.log(`  ${status.padEnd(6)} ${result.name.padEnd(20)} ${info}`);
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`\nTotal: ${successCount}/${results.length} sources working`);
}

main().catch(console.error);
