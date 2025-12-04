/**
 * GitHub Actions utilities
 * Helpers for generating workflow files
 */

import { z } from "zod";

// Step types
export const StepSchema = z.object({
  name: z.string().optional(),
  uses: z.string().optional(),
  run: z.string().optional(),
  with: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  env: z.record(z.string()).optional(),
  if: z.string().optional(),
  id: z.string().optional(),
  "continue-on-error": z.boolean().optional(),
  "timeout-minutes": z.number().optional(),
  "working-directory": z.string().optional(),
});

export type Step = z.infer<typeof StepSchema>;

// Job types
export const JobSchema = z.object({
  name: z.string().optional(),
  "runs-on": z.union([z.string(), z.array(z.string())]),
  needs: z.union([z.string(), z.array(z.string())]).optional(),
  if: z.string().optional(),
  env: z.record(z.string()).optional(),
  steps: z.array(StepSchema),
  strategy: z.object({
    matrix: z.record(z.array(z.any())).optional(),
    "fail-fast": z.boolean().optional(),
    "max-parallel": z.number().optional(),
  }).optional(),
  timeout: z.number().optional(),
  services: z.record(z.object({
    image: z.string(),
    ports: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  })).optional(),
});

export type Job = z.infer<typeof JobSchema>;

// Workflow types
export const WorkflowSchema = z.object({
  name: z.string(),
  on: z.union([
    z.string(),
    z.array(z.string()),
    z.object({
      push: z.object({
        branches: z.array(z.string()).optional(),
        paths: z.array(z.string()).optional(),
        "paths-ignore": z.array(z.string()).optional(),
      }).optional(),
      pull_request: z.object({
        branches: z.array(z.string()).optional(),
        paths: z.array(z.string()).optional(),
        types: z.array(z.string()).optional(),
      }).optional(),
      workflow_dispatch: z.object({
        inputs: z.record(z.object({
          description: z.string().optional(),
          required: z.boolean().optional(),
          default: z.string().optional(),
          type: z.enum(["string", "boolean", "choice", "environment"]).optional(),
          options: z.array(z.string()).optional(),
        })).optional(),
      }).optional(),
      schedule: z.array(z.object({ cron: z.string() })).optional(),
    }),
  ]),
  env: z.record(z.string()).optional(),
  permissions: z.record(z.enum(["read", "write", "none"])).optional(),
  concurrency: z.object({
    group: z.string(),
    "cancel-in-progress": z.boolean().optional(),
  }).optional(),
  jobs: z.record(JobSchema),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// Common steps
export const CommonSteps = {
  checkout: (options?: { fetch_depth?: number }): Step => ({
    name: "Checkout",
    uses: "actions/checkout@v4",
    ...(options?.fetch_depth !== undefined && { with: { "fetch-depth": options.fetch_depth } }),
  }),

  setupNode: (version: string = "20"): Step => ({
    name: "Setup Node.js",
    uses: "actions/setup-node@v4",
    with: { "node-version": version },
  }),

  setupPnpm: (version: string = "9"): Step => ({
    name: "Setup pnpm",
    uses: "pnpm/action-setup@v4",
    with: { version },
  }),

  cacheNode: (): Step => ({
    name: "Cache node modules",
    uses: "actions/cache@v4",
    with: {
      path: "node_modules\n.pnpm-store",
      key: "${{ runner.os }}-node-${{ hashFiles('**/pnpm-lock.yaml') }}",
      "restore-keys": "${{ runner.os }}-node-",
    },
  }),

  install: (packageManager: "npm" | "pnpm" | "yarn" = "pnpm"): Step => ({
    name: "Install dependencies",
    run: packageManager === "pnpm" ? "pnpm install --frozen-lockfile" :
      packageManager === "yarn" ? "yarn install --frozen-lockfile" :
        "npm ci",
  }),

  lint: (): Step => ({
    name: "Lint",
    run: "pnpm lint",
  }),

  typecheck: (): Step => ({
    name: "Type check",
    run: "pnpm typecheck",
  }),

  test: (): Step => ({
    name: "Run tests",
    run: "pnpm test",
  }),

  build: (): Step => ({
    name: "Build",
    run: "pnpm build",
  }),

  uploadArtifact: (name: string, path: string): Step => ({
    name: `Upload ${name} artifact`,
    uses: "actions/upload-artifact@v4",
    with: { name, path },
  }),

  downloadArtifact: (name: string): Step => ({
    name: `Download ${name} artifact`,
    uses: "actions/download-artifact@v4",
    with: { name },
  }),
};

// Workflow templates
export const WorkflowTemplates = {
  ci: (options: {
    nodeVersion?: string;
    packageManager?: "npm" | "pnpm" | "yarn";
    runTests?: boolean;
    runLint?: boolean;
    runTypecheck?: boolean;
  } = {}): Workflow => ({
    name: "CI",
    on: {
      push: { branches: ["main"] },
      pull_request: { branches: ["main"] },
    },
    jobs: {
      build: {
        "runs-on": "ubuntu-latest",
        steps: [
          CommonSteps.checkout(),
          ...(options.packageManager === "pnpm" ? [CommonSteps.setupPnpm()] : []),
          CommonSteps.setupNode(options.nodeVersion ?? "20"),
          CommonSteps.cacheNode(),
          CommonSteps.install(options.packageManager ?? "pnpm"),
          ...(options.runLint !== false ? [CommonSteps.lint()] : []),
          ...(options.runTypecheck !== false ? [CommonSteps.typecheck()] : []),
          ...(options.runTests !== false ? [CommonSteps.test()] : []),
          CommonSteps.build(),
        ],
      },
    },
  }),

  deploy: (options: {
    environment: string;
    deployCommand: string;
    secrets?: string[];
  }): Workflow => ({
    name: "Deploy",
    on: {
      push: { branches: ["main"] },
      workflow_dispatch: {},
    },
    jobs: {
      deploy: {
        "runs-on": "ubuntu-latest",
        steps: [
          CommonSteps.checkout(),
          CommonSteps.setupPnpm(),
          CommonSteps.setupNode(),
          CommonSteps.install(),
          CommonSteps.build(),
          {
            name: `Deploy to ${options.environment}`,
            run: options.deployCommand,
            env: Object.fromEntries(
              (options.secrets ?? []).map((s) => [s, `\${{ secrets.${s} }}`])
            ),
          },
        ],
      },
    },
  }),

  release: (): Workflow => ({
    name: "Release",
    on: {
      push: { branches: ["main"] },
    },
    permissions: {
      contents: "write",
      "pull-requests": "write",
    },
    jobs: {
      release: {
        "runs-on": "ubuntu-latest",
        steps: [
          CommonSteps.checkout({ fetch_depth: 0 }),
          CommonSteps.setupPnpm(),
          CommonSteps.setupNode(),
          CommonSteps.install(),
          {
            name: "Create Release",
            uses: "changesets/action@v1",
            with: {
              publish: "pnpm release",
            },
            env: {
              GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
              NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
            },
          },
        ],
      },
    },
  }),
};

// Generate workflow YAML
export function generateWorkflow(workflow: Workflow): string {
  const yaml = require("yaml");
  return yaml.stringify(workflow, { lineWidth: 0 });
}
