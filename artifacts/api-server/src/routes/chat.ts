import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

// Initialize LLM client (Groq, OpenRouter, or OpenAI)
let llmClient: OpenAI | null = null;
let llmProvider: "groq" | "openrouter" | "openai" | null = null;

if (process.env.GROQ_API_KEY) {
  llmClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  llmProvider = "groq";
} else if (process.env.OPENROUTER_API_KEY) {
  llmClient = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });
  llmProvider = "openrouter";
} else if (process.env.OPENAI_API_KEY) {
  llmClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  llmProvider = "openai";
}

// Get oracle data for LLM context
async function getOracleContext(letter: string) {
  // This would fetch real oracle data from the letters endpoints
  // For now, return mock data structure
  return {
    letter,
    price_lgu: 0.1,
    weekly_change: 15.5,
    top_sources: [
      { name: "Solana Token Names", occurrences: 25000, weight: 0.10 },
      { name: "GitHub Repos", occurrences: 45000, weight: 0.06 },
      { name: "DNS Domains", occurrences: 150000, weight: 0.09 },
    ],
    market_sentiment: "bullish",
  };
}

// Create a new chat room or get existing messages
router.get("/chat/:room_id", async (req, res) => {
  try {
    const { room_id } = req.params;
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.room_id, room_id))
      .orderBy(desc(chatMessagesTable.created_at))
      .limit(50);
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat messages" });
  }
});

// Send a message to chat room
router.post("/chat/:room_id/message", async (req, res) => {
  try {
    const { room_id } = req.params;
    const { role, content, metadata } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({ error: "role and content required" });
    }
    
    const [message] = await db.insert(chatMessagesTable).values({
      room_id,
      role,
      content,
      metadata: metadata || null,
    }).returning();
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get LLM analysis for a letter
router.post("/chat/analyze-letter", async (req, res) => {
  try {
    const { letter } = req.body;
    
    if (!letter || !/^[A-Z]$/.test(letter)) {
      return res.status(400).json({ error: "Valid letter (A-Z) required" });
    }
    
    // Get oracle context
    const oracleContext = await getOracleContext(letter);
    
    // If LLM is not configured, return mock analysis
    if (!llmClient) {
      const mockAnalysis = `Letter ${letter} Analysis:

**Current Price:** ${oracleContext.price_lgu.toFixed(3)} LGU
**Weekly Change:** ${oracleContext.weekly_change >= 0 ? '+' : ''}${oracleContext.weekly_change.toFixed(1)}%
**Market Sentiment:** ${oracleContext.market_sentiment.toUpperCase()}

**Price Drivers:**
The current price is driven by strong performance across ${oracleContext.top_sources.length} major data sources. Top contributors include ${oracleContext.top_sources[0]?.name} with ${oracleContext.top_sources[0]?.occurrences.toLocaleString()} occurrences.

**Trading Outlook:**
Based on the ${oracleContext.weekly_change >= 0 ? 'positive' : 'negative'} weekly momentum, ${letter} shows ${oracleContext.weekly_change >= 0 ? 'bullish' : 'bearish'} signals. Consider staking if you believe in long-term language adoption.

**Recommendation:**
${oracleContext.weekly_change >= 0 ? 'Accumulate on dips. Strong fundamentals from multiple data sources support current valuation.' : 'Wait for stabilization. Current downtrend may present entry opportunities if sentiment reverses.'}`;

      return res.json({
        letter,
        oracle_context: oracleContext,
        analysis: mockAnalysis,
        model: "mock",
        timestamp: new Date().toISOString(),
      });
    }
    
    // Build system prompt with oracle data
    const systemPrompt = `You are a specialized letter analysis AI for the Language.fi protocol. You have access to real-time oracle data streams from 30+ data sources including blockchain ecosystems, developer platforms, social platforms, and web infrastructure.

Current oracle data for letter ${letter}:
- Price: ${oracleContext.price_lgu} LGU
- Weekly change: ${oracleContext.weekly_change}%
- Market sentiment: ${oracleContext.market_sentiment}

Top data sources:
${oracleContext.top_sources.map(s => `- ${s.name}: ${s.occurrences.toLocaleString()} occurrences (weight: ${s.weight})`).join('\n')}

Your analysis should:
1. Explain why this letter is priced at its current level based on the data
2. Identify which data sources are driving the price
3. Predict short-term price movement based on trends
4. Suggest staking opportunities or risks
5. Provide actionable insights for traders

Be concise, data-driven, and specific. Use the oracle data to back up your claims.`;
    
    const completion = await llmClient.chat.completions.create({
      model: llmProvider === "groq" ? "llama-3.3-70b-versatile" : llmProvider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze letter ${letter} and provide trading insights.` },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const analysis = completion.choices[0]?.message?.content || "Analysis failed";
    
    res.json({
      letter,
      oracle_context: oracleContext,
      analysis,
      model: llmProvider === "groq" ? "llama-3.3-70b-versatile" : llmProvider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4",
      provider: llmProvider,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("LLM analysis error:", error);
    res.status(500).json({ error: "Failed to analyze letter" });
  }
});

// Get letter analysis with chat history context
router.post("/chat/:room_id/analyze", async (req, res) => {
  try {
    const { room_id } = req.params;
    const { letter } = req.body;
    
    if (!letter || !/^[A-Z]$/.test(letter)) {
      return res.status(400).json({ error: "Valid letter (A-Z) required" });
    }
    
    // Get chat history
    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.room_id, room_id))
      .orderBy(desc(chatMessagesTable.created_at))
      .limit(10);
    
    // Get oracle context
    const oracleContext = await getOracleContext(letter);
    
    // If LLM is not configured, return mock analysis
    if (!llmClient) {
      const mockResponse = `Based on your query about ${letter}, here's the analysis:

**Current Price:** ${oracleContext.price_lgu.toFixed(3)} LGU
**Weekly Change:** ${oracleContext.weekly_change >= 0 ? '+' : ''}${oracleContext.weekly_change.toFixed(1)}%

The letter ${letter} is currently showing ${oracleContext.market_sentiment} sentiment across the oracle data streams. The top contributing data source is ${oracleContext.top_sources[0]?.name} with ${oracleContext.top_sources[0]?.occurrences.toLocaleString()} occurrences.

For trading: ${oracleContext.weekly_change >= 0 ? 'Consider staking at current levels given positive momentum.' : 'Wait for confirmation of reversal before entering positions.'}`;

      // Save assistant response to chat
      await db.insert(chatMessagesTable).values({
        room_id,
        role: "assistant",
        content: mockResponse,
        metadata: { oracle_context: oracleContext, letter },
      });

      return res.json({
        response: mockResponse,
        oracle_context: oracleContext,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Build messages for OpenAI
    const systemPrompt = `You are a specialized letter analysis AI for Language.fi. You have access to oracle data from 30+ sources.

Current oracle data for ${letter}:
- Price: ${oracleContext.price_lgu} LGU
- Weekly change: ${oracleContext.weekly_change}%
- Top sources: ${oracleContext.top_sources.map(s => s.name).join(', ')}

Provide data-driven analysis based on the oracle streams.`;
    
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.reverse().map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: `Analyze ${letter} with current context.` },
    ];
    
    const completion = await llmClient.chat.completions.create({
      model: llmProvider === "groq" ? "llama-3.3-70b-versatile" : llmProvider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4",
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const response = completion.choices[0]?.message?.content || "Analysis failed";
    
    // Save assistant response to chat
    await db.insert(chatMessagesTable).values({
      room_id,
      role: "assistant",
      content: response,
      metadata: { oracle_context: oracleContext, letter },
    });
    
    res.json({
      response,
      oracle_context: oracleContext,
      model: llmProvider === "groq" ? "llama-3.3-70b-versatile" : llmProvider === "openrouter" ? "anthropic/claude-3.5-sonnet" : "gpt-4",
      provider: llmProvider,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat analysis error:", error);
    res.status(500).json({ error: "Failed to analyze" });
  }
});

export default router;
