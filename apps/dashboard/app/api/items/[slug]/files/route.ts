import { NextRequest, NextResponse } from "next/server";
import { getItemBySlug, type RegistryItem } from "@/lib/data/registry";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, extname } from "path";

// Workspace root (adjust based on dashboard location)
const WORKSPACE_ROOT = join(process.cwd(), "..", "..");

// Map item slugs to their actual package paths
function getPackagePath(item: RegistryItem): string | null {
  // Map agent slugs to package directories
  const packageMap: Record<string, string> = {
    // Agents
    "wallet-agent": "packages/wallet-agent",
    "defi-agent": "packages/defi-agent",
    "hunter-agent": "packages/hunter-agent",
    "audit-agent": "packages/audit-agent",
    "decision-agent": "packages/decision-agent",
    "social-agent": "packages/social-agent",
    "bridge-agent": "packages/bridge-agent",
    "nft-agent": "packages/nft-agent",
    "dao-agent": "packages/dao-agent",
    "builder-agent": "packages/builder-agent",
    "refactor-agent": "packages/refactor-agent",
    "deployer-agent": "packages/deployer-agent",
    "ptc-coordinator": "packages/orchestrator",
    "autonomy-engine": "packages/autonomy",
    "product-engine": "packages/product-engine",
    "growth-engine": "packages/growth-engine",
    "money-engine": "packages/money-engine",
    // MCPs
    "context-engine-mcp": "services/context-engine",
    "solana-mcp": "packages/mcp-server",
    "github-mcp": "packages/mcp-server",
  };

  return packageMap[item.slug] || null;
}

// Get important source files from a package
function getPackageFiles(packagePath: string): { path: string; content: string }[] {
  const fullPath = join(WORKSPACE_ROOT, packagePath);
  const files: { path: string; content: string }[] = [];

  // Priority files to include
  const priorityFiles = [
    "src/index.ts",
    "src/index.tsx",
    "index.ts",
    "README.md",
    "package.json",
  ];

  // First add priority files if they exist
  for (const file of priorityFiles) {
    const filePath = join(fullPath, file);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      try {
        const content = readFileSync(filePath, "utf-8");
        files.push({
          path: file,
          content: content.slice(0, 10000), // Limit to 10KB per file
        });
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Then add other TypeScript files from src/
  const srcPath = join(fullPath, "src");
  if (existsSync(srcPath) && statSync(srcPath).isDirectory()) {
    const srcFiles = collectTsFiles(srcPath, srcPath);
    for (const sf of srcFiles) {
      // Skip if already added as priority
      if (files.some(f => f.path === `src/${sf.relativePath}`)) continue;

      files.push({
        path: `src/${sf.relativePath}`,
        content: sf.content.slice(0, 10000),
      });
    }
  }

  return files.slice(0, 10); // Limit to 10 files max
}

// Recursively collect TypeScript files
function collectTsFiles(
  dir: string,
  baseDir: string,
  maxDepth = 2,
  depth = 0
): { relativePath: string; content: string }[] {
  const result: { relativePath: string; content: string }[] = [];

  if (depth > maxDepth) return result;

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules" && entry !== "dist") {
        result.push(...collectTsFiles(fullPath, baseDir, maxDepth, depth + 1));
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext) && !entry.endsWith(".d.ts")) {
          try {
            const content = readFileSync(fullPath, "utf-8");
            const relativePath = relative(baseDir, fullPath).replace(/\\/g, "/");
            result.push({ relativePath, content });
          } catch {
            // Skip
          }
        }
      }
    }
  } catch {
    // Skip unreadable directories
  }

  return result;
}

// Generate fallback content for items without packages
function generateFallbackContent(item: RegistryItem): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];

  switch (item.kind) {
    case "agent":
      files.push({
        path: `AGENT.md`,
        content: `# ${item.name}

${item.description}

## Installation

\`\`\`bash
${item.install}
\`\`\`

## Category
${item.category}

## Tags
${item.tags.join(", ")}

## Model Recommendation
${item.modelRecommendation || "sonnet"}
`,
      });
      break;

    case "skill":
      files.push({
        path: `SKILL.md`,
        content: `# ${item.name}

${item.description}

## Installation

\`\`\`bash
${item.install}
\`\`\`

## Usage

This skill can be invoked by the agent to ${item.description.toLowerCase()}.
`,
      });
      break;

    case "command":
      files.push({
        path: `COMMAND.md`,
        content: `# ${item.name}

${item.description}

## Installation

\`\`\`bash
${item.install}
\`\`\`

## Usage

\`\`\`
/${item.slug.replace(/-/g, " ")}
\`\`\`
`,
      });
      break;

    case "mcp":
      files.push({
        path: `settings.json`,
        content: JSON.stringify(
          {
            mcpServers: {
              [item.slug]: {
                command: "npx",
                args: [`@gicm/${item.slug}`],
              },
            },
          },
          null,
          2
        ),
      });
      break;

    case "workflow":
      files.push({
        path: `WORKFLOW.md`,
        content: `# ${item.name}

${item.description}

## Installation

\`\`\`bash
${item.install}
\`\`\`

## Dependencies
${item.dependencies?.join(", ") || "None"}
`,
      });
      break;

    default:
      files.push({
        path: `${item.kind.toUpperCase()}.md`,
        content: `# ${item.name}\n\n${item.description}`,
      });
  }

  return files;
}

// Get files for an item - tries real files first, falls back to generated
function getFilesForItem(item: RegistryItem): { path: string; content: string }[] {
  const packagePath = getPackagePath(item);

  if (packagePath) {
    const realFiles = getPackageFiles(packagePath);
    if (realFiles.length > 0) {
      return realFiles;
    }
  }

  return generateFallbackContent(item);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const item = getItemBySlug(slug);

  if (!item) {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  try {
    const files = getFilesForItem(item);
    return NextResponse.json(files);
  } catch (error) {
    console.error(`Error getting files for ${slug}:`, error);
    // Return fallback content on error
    const fallback = generateFallbackContent(item);
    return NextResponse.json(fallback);
  }
}
