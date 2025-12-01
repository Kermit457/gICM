import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/content/index.ts",
    "src/social/index.ts",
  ],
  format: ["esm"],
  dts: false, // TODO: Fix type mismatches in Twitter module (content vs text, BlogPost partial usage)
  clean: true,
  splitting: true,
  sourcemap: true,
});
