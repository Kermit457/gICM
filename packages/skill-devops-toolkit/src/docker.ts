/**
 * Docker utilities
 * Helpers for generating Dockerfiles and docker-compose configurations
 */

import { z } from "zod";

// Dockerfile instruction types
export type DockerInstruction =
  | { type: "FROM"; image: string; as?: string }
  | { type: "WORKDIR"; path: string }
  | { type: "COPY"; src: string; dest: string; from?: string }
  | { type: "RUN"; command: string | string[] }
  | { type: "ENV"; key: string; value: string }
  | { type: "ARG"; key: string; default?: string }
  | { type: "EXPOSE"; port: number }
  | { type: "CMD"; command: string[] }
  | { type: "ENTRYPOINT"; command: string[] }
  | { type: "USER"; user: string }
  | { type: "LABEL"; labels: Record<string, string> }
  | { type: "HEALTHCHECK"; cmd: string; interval?: string; timeout?: string };

// Generate Dockerfile content
export function generateDockerfile(instructions: DockerInstruction[]): string {
  return instructions
    .map((inst) => {
      switch (inst.type) {
        case "FROM":
          return `FROM ${inst.image}${inst.as ? ` AS ${inst.as}` : ""}`;
        case "WORKDIR":
          return `WORKDIR ${inst.path}`;
        case "COPY":
          return `COPY ${inst.from ? `--from=${inst.from} ` : ""}${inst.src} ${inst.dest}`;
        case "RUN":
          return `RUN ${Array.isArray(inst.command) ? inst.command.join(" && \\\n    ") : inst.command}`;
        case "ENV":
          return `ENV ${inst.key}=${inst.value}`;
        case "ARG":
          return `ARG ${inst.key}${inst.default ? `=${inst.default}` : ""}`;
        case "EXPOSE":
          return `EXPOSE ${inst.port}`;
        case "CMD":
          return `CMD [${inst.command.map((c) => `"${c}"`).join(", ")}]`;
        case "ENTRYPOINT":
          return `ENTRYPOINT [${inst.command.map((c) => `"${c}"`).join(", ")}]`;
        case "USER":
          return `USER ${inst.user}`;
        case "LABEL":
          return Object.entries(inst.labels)
            .map(([k, v]) => `LABEL ${k}="${v}"`)
            .join("\n");
        case "HEALTHCHECK":
          const opts = [
            inst.interval ? `--interval=${inst.interval}` : "",
            inst.timeout ? `--timeout=${inst.timeout}` : "",
          ].filter(Boolean).join(" ");
          return `HEALTHCHECK ${opts} CMD ${inst.cmd}`;
      }
    })
    .join("\n\n");
}

// Pre-built Dockerfile templates
export const DockerTemplates = {
  node: (options: { nodeVersion?: string; port?: number } = {}): DockerInstruction[] => [
    { type: "FROM", image: `node:${options.nodeVersion ?? "20"}-alpine`, as: "builder" },
    { type: "WORKDIR", path: "/app" },
    { type: "COPY", src: "package*.json", dest: "./" },
    { type: "RUN", command: "npm ci" },
    { type: "COPY", src: ".", dest: "." },
    { type: "RUN", command: "npm run build" },
    { type: "FROM", image: `node:${options.nodeVersion ?? "20"}-alpine` },
    { type: "WORKDIR", path: "/app" },
    { type: "COPY", src: "package*.json", dest: "./" },
    { type: "RUN", command: "npm ci --only=production" },
    { type: "COPY", src: "--from=builder /app/dist", dest: "./dist", from: "builder" },
    { type: "USER", user: "node" },
    { type: "EXPOSE", port: options.port ?? 3000 },
    { type: "CMD", command: ["node", "dist/index.js"] },
  ],

  nextjs: (options: { nodeVersion?: string } = {}): DockerInstruction[] => [
    { type: "FROM", image: `node:${options.nodeVersion ?? "20"}-alpine`, as: "deps" },
    { type: "WORKDIR", path: "/app" },
    { type: "COPY", src: "package*.json", dest: "./" },
    { type: "RUN", command: "npm ci" },
    { type: "FROM", image: `node:${options.nodeVersion ?? "20"}-alpine`, as: "builder" },
    { type: "WORKDIR", path: "/app" },
    { type: "COPY", src: "--from=deps /app/node_modules", dest: "./node_modules", from: "deps" },
    { type: "COPY", src: ".", dest: "." },
    { type: "ENV", key: "NEXT_TELEMETRY_DISABLED", value: "1" },
    { type: "RUN", command: "npm run build" },
    { type: "FROM", image: `node:${options.nodeVersion ?? "20"}-alpine` },
    { type: "WORKDIR", path: "/app" },
    { type: "ENV", key: "NODE_ENV", value: "production" },
    { type: "COPY", src: "--from=builder /app/public", dest: "./public", from: "builder" },
    { type: "COPY", src: "--from=builder /app/.next/standalone", dest: "./", from: "builder" },
    { type: "COPY", src: "--from=builder /app/.next/static", dest: "./.next/static", from: "builder" },
    { type: "USER", user: "node" },
    { type: "EXPOSE", port: 3000 },
    { type: "CMD", command: ["node", "server.js"] },
  ],

  python: (options: { pythonVersion?: string; port?: number } = {}): DockerInstruction[] => [
    { type: "FROM", image: `python:${options.pythonVersion ?? "3.12"}-slim` },
    { type: "WORKDIR", path: "/app" },
    { type: "ENV", key: "PYTHONUNBUFFERED", value: "1" },
    { type: "COPY", src: "requirements.txt", dest: "." },
    { type: "RUN", command: "pip install --no-cache-dir -r requirements.txt" },
    { type: "COPY", src: ".", dest: "." },
    { type: "EXPOSE", port: options.port ?? 8000 },
    { type: "CMD", command: ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"] },
  ],
};

// Docker Compose schema
export const DockerComposeServiceSchema = z.object({
  image: z.string().optional(),
  build: z.union([z.string(), z.object({
    context: z.string(),
    dockerfile: z.string().optional(),
    target: z.string().optional(),
  })]).optional(),
  ports: z.array(z.string()).optional(),
  environment: z.record(z.string()).optional(),
  env_file: z.union([z.string(), z.array(z.string())]).optional(),
  volumes: z.array(z.string()).optional(),
  depends_on: z.array(z.string()).optional(),
  restart: z.enum(["no", "always", "unless-stopped", "on-failure"]).optional(),
  networks: z.array(z.string()).optional(),
  healthcheck: z.object({
    test: z.union([z.string(), z.array(z.string())]),
    interval: z.string().optional(),
    timeout: z.string().optional(),
    retries: z.number().optional(),
  }).optional(),
});

export type DockerComposeService = z.infer<typeof DockerComposeServiceSchema>;

export const DockerComposeSchema = z.object({
  version: z.string().optional(),
  services: z.record(DockerComposeServiceSchema),
  networks: z.record(z.object({
    driver: z.string().optional(),
  })).optional(),
  volumes: z.record(z.object({
    driver: z.string().optional(),
  })).optional(),
});

export type DockerCompose = z.infer<typeof DockerComposeSchema>;

// Generate docker-compose.yml
export function generateDockerCompose(config: DockerCompose): string {
  const yaml = require("yaml");
  return yaml.stringify(config);
}
