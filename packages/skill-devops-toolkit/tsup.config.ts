import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/docker.ts",
    "src/github-actions.ts",
    "src/kubernetes.ts",
    "src/terraform.ts",
  ],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
});
