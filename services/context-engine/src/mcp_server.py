#!/usr/bin/env python3
"""gICM Context Engine MCP Server - Semantic search for 513+ marketplace components."""

import asyncio
import json
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# Create server
server = Server("gicm-context")

# Context Engine API
API_URL = "http://localhost:8000"


@server.list_tools()
async def list_tools():
    """List available tools."""
    return [
        Tool(
            name="search_gicm",
            description="Search the gICM marketplace for UI components, blocks, templates, and integrations. Searches 513+ items semantically.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language search query (e.g., 'animated button with glow effect', 'dark mode toggle', 'pricing table')",
                    },
                    "kind": {
                        "type": "string",
                        "description": "Filter by kind: component, block, template, integration",
                        "enum": ["component", "block", "template", "integration"],
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of results (default: 5, max: 20)",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="search_tools",
            description="[Tool Search Tool] Discover and load tools from gICM's 513+ agents, integrations, and MCP servers. Returns Claude-compatible tool definitions for dynamic tool loading. Use this to find relevant tools based on user intent WITHOUT loading all tool definitions upfront (85% context reduction).",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language description of the capability needed (e.g., 'Solana token analysis', 'security audit', 'Twitter automation')",
                    },
                    "kind": {
                        "type": "string",
                        "description": "Filter by kind: agent, tool, integration, skill, block, template",
                        "enum": ["agent", "tool", "integration", "skill", "block", "template"],
                    },
                    "platform": {
                        "type": "string",
                        "description": "Target platform: claude, gemini, openai",
                        "enum": ["claude", "gemini", "openai"],
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of tools to return (default: 5, max: 10)",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="get_install_command",
            description="Get the install command for a gICM component by name or ID.",
            inputSchema={
                "type": "object",
                "properties": {
                    "component": {
                        "type": "string",
                        "description": "Component name or ID to get install command for",
                    },
                },
                "required": ["component"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """Handle tool calls."""
    if name == "search_gicm":
        return await search_gicm(arguments)
    elif name == "search_tools":
        return await search_tools(arguments)
    elif name == "get_install_command":
        return await get_install_command(arguments)
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def search_gicm(args: dict):
    """Search gICM marketplace."""
    query = args.get("query", "")
    kind = args.get("kind")
    limit = min(args.get("limit", 5), 20)

    payload = {
        "query": query,
        "collection": "gicm_components",
        "limit": limit,
    }
    if kind:
        payload["kind"] = kind

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{API_URL}/search", json=payload)
            response.raise_for_status()
            data = response.json()

        results = data.get("results", [])
        if not results:
            return [TextContent(type="text", text=f"No results found for: {query}")]

        # Format results
        output = [f"## Found {len(results)} results for \"{query}\"\n"]
        for i, r in enumerate(results, 1):
            p = r.get("payload", {})
            score = r.get("score", 0)

            output.append(f"### {i}. {p.get('name', 'Unknown')}")
            output.append(f"**Kind:** {p.get('kind', 'component')} | **Category:** {p.get('category', 'UI')} | **Score:** {score:.2f}")
            output.append(f"**Description:** {p.get('description', 'No description')}")

            if tags := p.get("tags", []):
                output.append(f"**Tags:** {', '.join(tags)}")

            if install := p.get("install"):
                output.append(f"```bash\n{install}\n```")

            output.append("")

        return [TextContent(type="text", text="\n".join(output))]

    except httpx.ConnectError:
        return [TextContent(type="text", text="Error: Context Engine not running. Start it with: cd services/context-engine && python -m uvicorn src.main:app --port 8000")]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]


async def search_tools(args: dict):
    """[Tool Search Tool] Discover tools from gICM registry.

    Returns Claude-compatible tool definitions for dynamic loading.
    This enables 85% context reduction by loading only relevant tools.
    """
    query = args.get("query", "")
    kind = args.get("kind")
    platform = args.get("platform", "claude")
    limit = min(args.get("limit", 5), 10)

    # Call gICM API for tool search
    gicm_api = "https://gicm.dev/api/tools/search"

    payload = {
        "query": query,
        "limit": limit,
        "platform": platform,
    }
    if kind:
        payload["kind"] = kind

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(gicm_api, json=payload)
            response.raise_for_status()
            data = response.json()

        tools = data.get("tools", [])
        results = data.get("results", [])
        meta = data.get("meta", {})

        if not tools:
            return [TextContent(type="text", text=f"No tools found for: {query}")]

        # Format output with tool definitions
        output = [
            f"## Tool Search Results",
            f"Query: \"{query}\" | Found: {len(tools)} tools | Time: {meta.get('searchTime', 0)}ms\n",
            "### Available Tools\n",
        ]

        for i, result in enumerate(results, 1):
            tool = result.get("tool", {})
            metadata = result.get("metadata", {})
            score = result.get("score", 0)

            output.append(f"**{i}. {tool.get('name', 'unknown')}**")
            output.append(f"- Category: {metadata.get('category', 'Unknown')}")
            output.append(f"- Kind: {metadata.get('kind', 'tool')}")
            output.append(f"- Quality: {metadata.get('qualityScore', 0)}/100")
            output.append(f"- Install: `{metadata.get('install', 'N/A')}`")
            output.append("")

        # Include raw tool definitions for Claude to use
        output.append("\n### Tool Definitions (Claude-compatible)\n")
        output.append("```json")
        output.append(json.dumps(tools, indent=2))
        output.append("```")

        return [TextContent(type="text", text="\n".join(output))]

    except httpx.ConnectError:
        # Fallback to local Context Engine search
        return await search_gicm({"query": query, "kind": kind, "limit": limit})
    except Exception as e:
        return [TextContent(type="text", text=f"Error searching tools: {str(e)}")]


async def get_install_command(args: dict):
    """Get install command for a component."""
    component = args.get("component", "")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{API_URL}/search",
                json={"query": component, "collection": "gicm_components", "limit": 1},
            )
            response.raise_for_status()
            data = response.json()

        results = data.get("results", [])
        if not results:
            return [TextContent(type="text", text=f"Component not found: {component}")]

        p = results[0].get("payload", {})
        name = p.get("name", "Unknown")
        install = p.get("install", "")

        if not install:
            return [TextContent(type="text", text=f"No install command available for {name}. Check https://gicm.dev for manual installation.")]

        return [TextContent(type="text", text=f"## {name}\n\n```bash\n{install}\n```")]

    except Exception as e:
        return [TextContent(type="text", text=f"Error: {str(e)}")]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
