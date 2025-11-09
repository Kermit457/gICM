import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { REGISTRY } from '@/lib/registry';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Build a catalog description for Claude
    const catalogDescription = REGISTRY.map(item => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      description: item.description,
      tags: item.tags,
      category: item.category,
      tokenSavings: item.tokenSavings,
    }));

    // Create the system prompt
    const systemPrompt = `You are an expert AI assistant helping developers build optimal tech stacks. You have access to a catalog of agents, skills, commands, and MCP integrations.

Your task is to analyze the user's project description and recommend the most suitable items from the catalog. Consider:
1. The user's specific needs and requirements
2. How items complement each other
3. Avoiding redundancy
4. Maximizing token savings
5. Best practices for the mentioned technologies

Available catalog items:
${JSON.stringify(catalogDescription, null, 2)}

Respond with a JSON object in this exact format:
{
  "itemIds": ["id1", "id2", "id3"],
  "reasoning": "Brief explanation of why these items were chosen and how they work together"
}

Only include item IDs that exist in the catalog. Be selective - quality over quantity.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: systemPrompt,
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (Claude might wrap it in markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);
    const { itemIds, reasoning } = aiResponse;

    if (!Array.isArray(itemIds)) {
      throw new Error('Invalid response format from AI');
    }

    // Get the actual items
    const items = itemIds
      .map(id => REGISTRY.find(item => item.id === id))
      .filter(Boolean);

    if (items.length === 0) {
      throw new Error('No matching items found');
    }

    // Calculate stats
    const breakdown = {
      agents: items.filter(i => i!.kind === 'agent').length,
      skills: items.filter(i => i!.kind === 'skill').length,
      commands: items.filter(i => i!.kind === 'command').length,
      mcps: items.filter(i => i!.kind === 'mcp').length,
    };

    const totalTokenSavings = items.reduce((sum, item) => sum + (item!.tokenSavings || 0), 0);

    return NextResponse.json({
      items,
      reasoning,
      totalTokenSavings,
      breakdown,
    });

  } catch (error) {
    console.error('Workflow build error:', error);

    // Fallback response if API key is not configured
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return a basic recommendation based on keywords
      const promptLower = (await request.json()).prompt.toLowerCase();
      let items = [];

      if (promptLower.includes('solana') || promptLower.includes('defi')) {
        items = REGISTRY.filter(item =>
          item.tags.some(tag =>
            tag.toLowerCase().includes('solana') ||
            tag.toLowerCase().includes('blockchain')
          )
        ).slice(0, 5);
      } else if (promptLower.includes('react') || promptLower.includes('frontend')) {
        items = REGISTRY.filter(item =>
          item.tags.some(tag =>
            tag.toLowerCase().includes('react') ||
            tag.toLowerCase().includes('frontend')
          )
        ).slice(0, 5);
      } else {
        // Default: return most popular items
        items = [...REGISTRY]
          .sort((a, b) => (b.installs || 0) - (a.installs || 0))
          .slice(0, 5);
      }

      const breakdown = {
        agents: items.filter(i => i.kind === 'agent').length,
        skills: items.filter(i => i.kind === 'skill').length,
        commands: items.filter(i => i.kind === 'command').length,
        mcps: items.filter(i => i.kind === 'mcp').length,
      };

      return NextResponse.json({
        items,
        reasoning: 'Basic recommendation based on keywords (AI API key not configured)',
        totalTokenSavings: items.reduce((sum, item) => sum + (item.tokenSavings || 0), 0),
        breakdown,
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
