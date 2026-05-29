import { Router } from "express";
import { db } from "@workspace/db";
import { promptsTable, responsesTable, promptStakesTable, responseStakesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Create a new prompt
router.post("/prompts", async (req, res) => {
  try {
    const { content, author_address } = req.body;
    if (!content || !author_address) {
      return res.status(400).json({ error: "content and author_address required" });
    }
    
    const [prompt] = await db.insert(promptsTable).values({
      content,
      author_address,
    }).returning();
    
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: "Failed to create prompt" });
  }
});

// Get all prompts
router.get("/prompts", async (_req, res) => {
  try {
    const prompts = await db.select().from(promptsTable).orderBy(desc(promptsTable.created_at));
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prompts" });
  }
});

// Get a single prompt with responses
router.get("/prompts/:id", async (req, res) => {
  try {
    const promptId = parseInt(req.params.id);
    const [prompt] = await db.select().from(promptsTable).where(eq(promptsTable.id, promptId));
    
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    
    const responses = await db.select()
      .from(responsesTable)
      .where(eq(responsesTable.prompt_id, promptId))
      .orderBy(desc(responsesTable.created_at));
    
    res.json({ ...prompt, responses });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prompt" });
  }
});

// Create a response to a prompt
router.post("/responses", async (req, res) => {
  try {
    const { prompt_id, content, llm_model, author_address } = req.body;
    if (!prompt_id || !content || !llm_model || !author_address) {
      return res.status(400).json({ error: "prompt_id, content, llm_model, and author_address required" });
    }
    
    const [response] = await db.insert(responsesTable).values({
      prompt_id,
      content,
      llm_model,
      author_address,
    }).returning();
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to create response" });
  }
});

// Stake a prompt
router.post("/prompts/:id/stake", async (req, res) => {
  try {
    const promptId = parseInt(req.params.id);
    const { staker_address, amount_lgu } = req.body;
    
    if (!staker_address || !amount_lgu) {
      return res.status(400).json({ error: "staker_address and amount_lgu required" });
    }
    
    // Create stake record
    const [stake] = await db.insert(promptStakesTable).values({
      prompt_id: promptId,
      staker_address,
      amount_lgu,
    }).returning();
    
    // Update prompt staking status
    await db.update(promptsTable)
      .set({ 
        staked: true, 
        staked_at: new Date(),
        stake_amount_lgu: amount_lgu 
      })
      .where(eq(promptsTable.id, promptId));
    
    res.json(stake);
  } catch (error) {
    res.status(500).json({ error: "Failed to stake prompt" });
  }
});

// Stake a response
router.post("/responses/:id/stake", async (req, res) => {
  try {
    const responseId = parseInt(req.params.id);
    const { staker_address, amount_lgu } = req.body;
    
    if (!staker_address || !amount_lgu) {
      return res.status(400).json({ error: "staker_address and amount_lgu required" });
    }
    
    // Create stake record
    const [stake] = await db.insert(responseStakesTable).values({
      response_id: responseId,
      staker_address,
      amount_lgu,
    }).returning();
    
    // Update response staking status
    await db.update(responsesTable)
      .set({ 
        staked: true, 
        staked_at: new Date(),
        stake_amount_lgu: amount_lgu 
      })
      .where(eq(responsesTable.id, responseId));
    
    res.json(stake);
  } catch (error) {
    res.status(500).json({ error: "Failed to stake response" });
  }
});

// Get staking leaderboard for prompts
router.get("/prompts/leaderboard", async (_req, res) => {
  try {
    const prompts = await db.select()
      .from(promptsTable)
      .where(eq(promptsTable.staked, true))
      .orderBy(desc(promptsTable.stake_amount_lgu))
      .limit(20);
    
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Get staking leaderboard for responses
router.get("/responses/leaderboard", async (_req, res) => {
  try {
    const responses = await db.select()
      .from(responsesTable)
      .where(eq(responsesTable.staked, true))
      .orderBy(desc(responsesTable.stake_amount_lgu))
      .limit(20);
    
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
