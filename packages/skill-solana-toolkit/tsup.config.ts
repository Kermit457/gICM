import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/token.ts",
    "src/anchor.ts",
    "src/jupiter.ts",
    "src/pda.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ["@solana/web3.js", "@solana/spl-token"],
});
