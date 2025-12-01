import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/presets.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
});
