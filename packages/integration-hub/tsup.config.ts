import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  dts: false, // TODO: Fix type resolution issues with bullmq
  clean: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  splitting: true,
});
