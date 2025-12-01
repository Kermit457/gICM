import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cli.ts",
    "src/decision/index.ts",
    "src/execution/index.ts",
    "src/approval/index.ts",
    "src/audit/index.ts",
    "src/integration/index.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  splitting: true,
});
