import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/brain/cli.ts"],
  format: ["esm"],
  dts: false, // Disabled - dependencies lack type declarations
  sourcemap: true,
  clean: true,
  external: [
    "@gicm/growth-engine",
    "@gicm/product-engine",
    "@gicm/money-engine",
    "@gicm/agent-core",
    "@gicm/integration-hub",
  ],
});
