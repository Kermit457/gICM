import { Agent, AgentMetric, ModelUpdate, Post } from '../types/content-engine'
import { SYSTEM_PROMPT, WEEKLY_REPORT_PROMPT, MODEL_UPDATE_PROMPT } from './prompts'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Optional: defaults to process.env.ANTHROPIC_API_KEY
})

// Using Claude for the "Raoul Pal + Arthur Hayes" tone
async function callLLM(system: string, user: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      system: system,
      messages: [
        { role: 'user', content: user }
      ],
      temperature: 0.7,
    })

    if (message.content[0].type === 'text') {
      return message.content[0].text
    }
    return ''
  } catch (error) {
    console.error('Error calling LLM:', error)
    return "Error generating content. Please check logs."
  }
}

export class ContentGenerator {
  
  async generateWeeklyReport(
    agents: Agent[], 
    metrics: AgentMetric[], 
    marketContext: string
  ): Promise<Partial<Post>> {
    
    // Format data for the prompt
    const dataString = agents.map(agent => {
      const agentMetrics = metrics.filter(m => m.agent_id === agent.id)
      if (agentMetrics.length === 0) return ''
      
      const latest = agentMetrics[0]
      return `
      Agent: ${agent.name} (${agent.strategy_type})
      PnL: ${latest.pnl_abs} (${latest.pnl_percent}%)
      Win Rate: ${latest.win_rate}%
      Drawdown: ${latest.max_drawdown}%
      Trades: ${latest.trade_count}
      `
    }).join('\n')

    const prompt = WEEKLY_REPORT_PROMPT.replace('{{AGENT_DATA}}', `Market Context: ${marketContext}\n${dataString}`)
    
    const content = await callLLM(SYSTEM_PROMPT, prompt)
    
    return {
      title: `Agent Performance Report - Week ${new Date().getWeek()}`,
      slug: `agent-report-week-${new Date().getWeek()}-${new Date().getFullYear()}`,
      type: 'agent-report',
      status: 'draft',
      content: content,
      tags: ['weekly-report', 'performance', 'stats'],
      author: 'gICM Desk'
    }
  }

  async generateModelUpdateLog(update: ModelUpdate, agentName: string): Promise<Partial<Post>> {
    let impactStr = ''
    if (update.impact_metrics) {
      impactStr = update.impact_metrics.map(m => `${m.metric}: ${m.before} -> ${m.after}`).join(', ')
    }

    const prompt = MODEL_UPDATE_PROMPT
      .replace('{{AGENT_NAME}}', agentName)
      .replace('{{VERSION}}', update.version)
      .replace('{{PREV_VERSION}}', update.previous_version || 'N/A')
      .replace('{{CHANGES}}', update.changes_summary)
      .replace('{{IMPACT}}', impactStr)

    const content = await callLLM(SYSTEM_PROMPT, prompt)

    return {
      title: `Model Update: ${agentName} v${update.version}`,
      slug: `model-update-${agentName.toLowerCase().replace(/\s+/g, '-')}-${update.version.replace('.', '-')}`,
      type: 'changelog',
      status: 'draft',
      content: content,
      tags: ['dev-log', 'update', agentName],
      author: 'gICM Engineering'
    }
  }
}

// Helper to get week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const onejan = new Date(this.getFullYear(), 0, 1);
  const millis = this.getTime() - onejan.getTime();
  return Math.ceil((((millis / 86400000) + onejan.getDay() + 1) / 7));
}
