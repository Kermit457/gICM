import { describe, it, expect, vi } from "vitest";
import { BaseAgent } from "../base-agent.js";
import type { AgentConfig, AgentContext, AgentResult } from "../types.js";

// Concrete implementation for testing
class TestAgent extends BaseAgent {
  getSystemPrompt(): string {
    return "You are a test agent";
  }

  async analyze(context: AgentContext): Promise<AgentResult> {
    return this.createResult(true, { analyzed: true }, undefined, 0.9, "Test analysis");
  }
}

describe("BaseAgent", () => {
  const defaultConfig: AgentConfig = {
    name: "test-agent",
    description: "A test agent",
    llmProvider: "openai",
    temperature: 0.7,
    maxTokens: 4096,
    verbose: false,
  };

  describe("constructor", () => {
    it("should initialize with name and config", () => {
      const agent = new TestAgent("test-agent", defaultConfig);
      expect(agent.getName()).toBe("test-agent");
      expect(agent.getConfig().name).toBe("test-agent");
    });

    it("should merge config with name", () => {
      const agent = new TestAgent("my-agent", { ...defaultConfig, name: "old-name" });
      expect(agent.getConfig().name).toBe("my-agent");
    });
  });

  describe("getName", () => {
    it("should return the agent name", () => {
      const agent = new TestAgent("test-agent", defaultConfig);
      expect(agent.getName()).toBe("test-agent");
    });
  });

  describe("getConfig", () => {
    it("should return the full config", () => {
      const agent = new TestAgent("test-agent", defaultConfig);
      const config = agent.getConfig();
      expect(config.description).toBe("A test agent");
      expect(config.llmProvider).toBe("openai");
      expect(config.temperature).toBe(0.7);
    });
  });

  describe("getTools", () => {
    it("should return empty array initially", () => {
      const agent = new TestAgent("test-agent", defaultConfig);
      expect(agent.getTools()).toEqual([]);
    });
  });

  describe("createResult", () => {
    it("should create a successful result", async () => {
      const agent = new TestAgent("test-agent", defaultConfig);
      const result = await agent.analyze({ chain: "solana", network: "mainnet-beta" });

      expect(result.success).toBe(true);
      expect(result.agent).toBe("test-agent");
      expect(result.data).toEqual({ analyzed: true });
      expect(result.confidence).toBe(0.9);
      expect(result.reasoning).toBe("Test analysis");
      expect(result.timestamp).toBeDefined();
    });

    it("should create a failed result with error", () => {
      const agent = new TestAgent("test-agent", defaultConfig);
      // Access protected method via analyze mock
      class FailingAgent extends TestAgent {
        async analyze(): Promise<AgentResult> {
          return this.createResult(false, undefined, "Something went wrong");
        }
      }

      const failingAgent = new FailingAgent("failing-agent", defaultConfig);
      return failingAgent.analyze({ chain: "solana", network: "mainnet-beta" }).then((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe("Something went wrong");
      });
    });
  });

  describe("parseJSON", () => {
    it("should parse JSON from code block", () => {
      class ParsingAgent extends TestAgent {
        testParseJSON(response: string) {
          return this.parseJSON(response);
        }
      }

      const agent = new ParsingAgent("test-agent", defaultConfig);
      const result = agent.testParseJSON('```json\n{"foo": "bar"}\n```');
      expect(result).toEqual({ foo: "bar" });
    });

    it("should parse raw JSON object", () => {
      class ParsingAgent extends TestAgent {
        testParseJSON(response: string) {
          return this.parseJSON(response);
        }
      }

      const agent = new ParsingAgent("test-agent", defaultConfig);
      const result = agent.testParseJSON('Some text before {"foo": "bar"} and after');
      expect(result).toEqual({ foo: "bar" });
    });

    it("should return null for invalid JSON", () => {
      class ParsingAgent extends TestAgent {
        testParseJSON(response: string) {
          return this.parseJSON(response);
        }
      }

      const agent = new ParsingAgent("test-agent", defaultConfig);
      const result = agent.testParseJSON("not valid json at all");
      expect(result).toBeNull();
    });
  });

  describe("log", () => {
    it("should log when verbose is true", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const agent = new TestAgent("test-agent", { ...defaultConfig, verbose: true });

      class LoggingAgent extends TestAgent {
        testLog(message: string, data?: unknown) {
          this.log(message, data);
        }
      }

      const loggingAgent = new LoggingAgent("test-agent", { ...defaultConfig, verbose: true });
      loggingAgent.testLog("Test message", { data: true });

      expect(consoleSpy).toHaveBeenCalledWith("[test-agent] Test message", { data: true });
      consoleSpy.mockRestore();
    });

    it("should not log when verbose is false", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      class LoggingAgent extends TestAgent {
        testLog(message: string, data?: unknown) {
          this.log(message, data);
        }
      }

      const loggingAgent = new LoggingAgent("test-agent", { ...defaultConfig, verbose: false });
      loggingAgent.testLog("Test message");

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
