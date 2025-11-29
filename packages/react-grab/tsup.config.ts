import { defineConfig } from "tsup";

export default defineConfig([
  // ESM build
  {
    entry: ["src/index.ts", "src/core/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  // IIFE build for CDN
  {
    entry: ["src/index.ts"],
    format: ["iife"],
    globalName: "GICMGrab",
    outDir: "dist",
    minify: true,
    outExtension: () => ({ js: ".global.js" }),
  },
]);
