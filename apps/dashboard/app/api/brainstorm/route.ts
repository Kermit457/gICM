import { NextResponse } from "next/server";

interface BrainstormRequest {
  method: string;
  topic: string;
  prompt: string;
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: Request) {
  try {
    const body: BrainstormRequest = await request.json();
    const { method, topic, prompt } = body;

    if (!topic || !prompt) {
      return NextResponse.json(
        { error: "Missing topic or prompt" },
        { status: 400 }
      );
    }

    // Check if Anthropic API key is configured
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI not configured", configured: false },
        { status: 503 }
      );
    }

    // Call Anthropic Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        system: `You are gICM's strategic brainstorming assistant. You help with structured thinking and analysis using proven brainstorming frameworks.

Your responses should be:
- Comprehensive but focused
- Actionable with concrete suggestions
- Formatted with clear sections and bullet points
- Tailored to Web3, DeFi, AI, and trading contexts when relevant

Current method: ${method}
Topic: ${topic}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      return NextResponse.json(
        { error: "AI API error", details: error },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.content?.find((c: { type: string }) => c.type === "text");
    const aiResponse = textContent?.text || "No response generated";

    return NextResponse.json({
      method,
      topic,
      response: aiResponse,
      model: data.model,
      usage: data.usage,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Brainstorm API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
