import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts", "src/boot-sequence.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "es2022",
  external: ["eventemitter3", "yaml", "zod"],
  treeshake: true,
});
