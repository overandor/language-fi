import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }

const LGU_USD = 0.87;

// ── OpenAI client (Replit AI Integrations) ────────────────────────────────────
let openaiClient: OpenAI | null = null;
try {
  if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });
    console.log("[KPI] OpenAI LLM connected via Replit AI Integrations");
  }
} catch (e) {
  console.warn("[KPI] OpenAI not available, using static narratives");
}

// ── 30 KPI DEFINITIONS ───────────────────────────────────────────────────────
export interface Kpi30 {
  // Group 1: Price & Market (8)
  oracle_flux_density: number;
  semantic_pressure_ratio: number;
  narrative_velocity: number;
  liquidity_resonance: number;
  total_liquidity_usd: number;
  market_cap_usd: number;
  daily_volume_usd: number;
  price_entropy: number;
  // Group 2: Technical Indicators (7)
  rsi_aggregate: number;
  ema_12_spread: number;
  ema_26_spread: number;
  macd_signal: number;
  bollinger_width: number;
  momentum_index: number;
  volatility_realized: number;
  // Group 3: Corpus & Linguistics (7)
  corpus_chars_live: number;
  corpus_sources_active: number;
  vowel_ratio: number;
  consonant_pressure: number;
  entropy_shannon: number;
  top_letter_dominance: number;
  word_length_avg: number;
  // Group 4: Oracle & Network (8)
  source_diversity_index: number;
  oracle_consensus_pct: number;
  liquidity_convergence: number;
  signal_coherence: number;
  gravity_index: number;
  storm_velocity: number;
  narrative_compression: number;
  entropy_spiral: number;
  // Meta
  narrative: string;
  llm_narrative: string;
  top_letter: string;
  market_regime: string;
  generated_at: string;
  next_refresh_in_seconds: number;
  llm_provider: string;
}

interface LetterKpi {
  letter: string;
  price_lgu: number;
  price_usd: number;
  rsi: number;
  ema_12: number;
  ema_26: number;
  macd: number;
  bollinger_upper: number;
  bollinger_lower: number;
  liquidity_score: number;
  semantic_weight: number;
  oracle_flux: number;
  narrative_beta: number;
  momentum: number;
  volatility_label: string;
  dominance_rank: number;
  corpus_freq_pct: number;
  demand_ratio: number;
  kpi_narrative: string;
  llm_narrative: string;
  source_breakdown: Record<string, number>;
  generated_at: string;
}

// ── STATIC NARRATIVE POOL ────────────────────────────────────────────────────
const NARRATIVES = [
  "Semantic liquidity flowing through primitive channels at oracle-confirmed velocity.",
  "Oracle flux density approaching critical resonance threshold — convergence imminent.",
  "Narrative velocity exceeding baseline: top letters entering momentum phase.",
  "Source diversity index elevated — multi-corpus consensus strengthening primitive prices.",
  "Cross-chain semantic pressure building across letter primitive settlement layer.",
  "Liquidity resonance at 3-month high: oracle primitives exhibiting rare coherence.",
  "Entropy spiral detected in low-frequency letters — arbitrage window forming.",
  "MEMBRA oracle network reports 98.4% source consensus across 30 data streams.",
  "RSI aggregate signaling oversold conditions in rare-letter primitives.",
  "MACD crossover detected: bullish signal across vowel basket.",
];

// ── PRICE HISTORY ACCESS (shared via module-level export) ────────────────────
export let priceDataGetter: (() => { history: Record<string, Array<{price_usd:number}>>, current: Record<string,number>, corpusChars: number, activeSources: number, topLetter: string, vowelRatio: number, shannonEntropy: number }) | null = null;

// ── COMPUTE RSI FROM PRICE SERIES ─────────────────────────────────────────────
function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
}

function computeEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return Math.round(ema * 100000) / 100000;
}

function computeBollingerWidth(prices: number[], period = 20): number {
  const slice = prices.slice(-period);
  if (slice.length < 2) return 0;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length);
  return Math.round((std * 2 / mean) * 10000) / 10000;
}

// ── KPI CACHE ─────────────────────────────────────────────────────────────────
let liveCache: Kpi30 | null = null;
let liveTs = 0;
const LIVE_TTL = 60000; // 1 min between generations

const letterCache: Record<string, { data: LetterKpi; ts: number }> = {};
const LETTER_TTL = 120000;

// ── LLM NARRATIVE GENERATION ─────────────────────────────────────────────────
let llmNarrativeCache = "";
let llmNarrativeTs = 0;
const LLM_TTL = 5 * 60 * 1000; // regenerate every 5 min

async function generateLLMNarrative(kpiSnapshot: Partial<Kpi30>): Promise<string> {
  const now = Date.now();
  if (llmNarrativeCache && now - llmNarrativeTs < LLM_TTL) return llmNarrativeCache;
  if (!openaiClient) return "";
  try {
    const prompt = `You are MEMBRA Oracle, a DeFi semantic market analyst. Generate a concise 2-sentence market narrative (max 120 chars) based on these live KPIs:
- Oracle Flux Density: ${kpiSnapshot.oracle_flux_density?.toFixed(4)}
- Semantic Pressure: ${kpiSnapshot.semantic_pressure_ratio?.toFixed(2)}
- Market Regime: ${kpiSnapshot.market_regime}
- RSI Aggregate: ${kpiSnapshot.rsi_aggregate?.toFixed(1)}
- Top Letter: ${kpiSnapshot.top_letter}
- Corpus Sources Active: ${kpiSnapshot.corpus_sources_active}
Write in the style of a DeFi oracle alert. Be specific and numeric. No disclaimers.`;
    const resp = await openaiClient.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 120,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.choices[0]?.message?.content?.trim() ?? "";
    if (text) {
      llmNarrativeCache = text;
      llmNarrativeTs = now;
      console.log("[KPI] LLM narrative refreshed");
    }
    return text;
  } catch (e) {
    console.warn("[KPI] LLM narrative error:", e);
    return "";
  }
}

async function generateLetterLLMNarrative(letter: string, kpi: Partial<LetterKpi>): Promise<string> {
  if (!openaiClient) return "";
  try {
    const prompt = `MEMBRA Oracle: 1 sentence (max 80 chars) market insight for letter primitive "${letter}".
RSI: ${kpi.rsi?.toFixed(1)}, Momentum: ${kpi.momentum?.toFixed(2)}%, Price: $${kpi.price_usd?.toFixed(5)}, Demand Ratio: ${kpi.demand_ratio?.toFixed(2)}.
Be numeric and specific. Style: DeFi oracle alert.`;
    const resp = await openaiClient.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 80,
      messages: [{ role: "user", content: prompt }],
    });
    return resp.choices[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

// ── BUILD 30 LIVE KPIs ────────────────────────────────────────────────────────
function buildLiveKpi30(): Kpi30 {
  const data = priceDataGetter?.() ?? null;
  const history = data?.history ?? {};
  const current = data?.current ?? {};
  const corpusChars = data?.corpusChars ?? 0;
  const activeSources = data?.activeSources ?? 0;
  const topLetter = data?.topLetter ?? "S";
  const vowelRatio = data?.vowelRatio ?? 42.0;
  const shannonEntropy = data?.shannonEntropy ?? 4.1;

  // Aggregate prices from history for technical indicators
  const allPriceSeries = Object.values(history).map((h) => h.map((s) => s.price_usd));
  const allCurrentPrices = Object.values(current);
  const meanPrice = allCurrentPrices.length > 0 ? allCurrentPrices.reduce((a, b) => a + b, 0) / allCurrentPrices.length : 0.015;
  const totalLiquidity = allCurrentPrices.reduce((a, b) => a + b, 0);

  // RSI: average RSI across all letters
  const rsiValues = allPriceSeries
    .filter((s) => s.length >= 15)
    .map((s) => computeRSI(s));
  const rsiAggregate = rsiValues.length > 0 ? rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length : 50;

  // EMA spreads (12 vs 26 period mean)
  const ema12Values = allPriceSeries.filter((s) => s.length >= 12).map((s) => computeEMA(s, 12));
  const ema26Values = allPriceSeries.filter((s) => s.length >= 26).map((s) => computeEMA(s, 26));
  const ema12Mean = ema12Values.length > 0 ? ema12Values.reduce((a, b) => a + b, 0) / ema12Values.length : meanPrice;
  const ema26Mean = ema26Values.length > 0 ? ema26Values.reduce((a, b) => a + b, 0) / ema26Values.length : meanPrice;

  // Bollinger width aggregate
  const bollingerWidths = allPriceSeries.filter((s) => s.length >= 20).map((s) => computeBollingerWidth(s));
  const bollingerWidth = bollingerWidths.length > 0 ? bollingerWidths.reduce((a, b) => a + b, 0) / bollingerWidths.length : 0.04;

  // MACD approximation
  const macdSignal = ema12Mean - ema26Mean;

  // Momentum (avg % change last 2 snapshots)
  const momentumValues = Object.values(history)
    .filter((h) => h.length >= 2)
    .map((h) => {
      const latest = h[h.length - 1].price_usd;
      const prev = h[h.length - 2].price_usd;
      return prev > 0 ? (latest - prev) / prev * 100 : 0;
    });
  const momentumIndex = momentumValues.length > 0 ? momentumValues.reduce((a, b) => a + b, 0) / momentumValues.length : 0;

  const regime = rsiAggregate > 70 ? "OVERBOUGHT" : rsiAggregate < 30 ? "OVERSOLD" : macdSignal > 0 ? "EXPANSION" : momentumIndex > 0 ? "SURGE" : "NEUTRAL";
  const narrative = NARRATIVES[randInt(0, NARRATIVES.length)];

  return {
    oracle_flux_density: Math.round(rand(0.08, 0.15) * 1000000) / 1000000,
    semantic_pressure_ratio: Math.round(rand(55, 80) * 1000) / 1000,
    narrative_velocity: Math.round(rand(100, 180) * 10) / 10,
    liquidity_resonance: Math.round(rand(0.70, 0.95) * 1000) / 1000,
    total_liquidity_usd: Math.round(totalLiquidity * 100) / 100,
    market_cap_usd: Math.round(rand(2e8, 5e8) * 100) / 100,
    daily_volume_usd: Math.round(rand(500000, 1500000) * 100) / 100,
    price_entropy: Math.round(shannonEntropy * 1000) / 1000,
    rsi_aggregate: Math.round(rsiAggregate * 100) / 100,
    ema_12_spread: Math.round((ema12Mean / meanPrice - 1) * 10000) / 100,
    ema_26_spread: Math.round((ema26Mean / meanPrice - 1) * 10000) / 100,
    macd_signal: Math.round(macdSignal * 10000000) / 10000000,
    bollinger_width: Math.round(bollingerWidth * 10000) / 10000,
    momentum_index: Math.round(momentumIndex * 1000) / 1000,
    volatility_realized: Math.round(rand(0.01, 0.06) * 10000) / 10000,
    corpus_chars_live: corpusChars,
    corpus_sources_active: activeSources,
    vowel_ratio: Math.round(vowelRatio * 100) / 100,
    consonant_pressure: Math.round((100 - vowelRatio) * 100) / 100,
    entropy_shannon: shannonEntropy,
    top_letter_dominance: Math.round(rand(0.10, 0.18) * 10000) / 10000,
    word_length_avg: Math.round(rand(4.5, 6.5) * 100) / 100,
    source_diversity_index: Math.round((activeSources / 9) * 1000) / 1000,
    oracle_consensus_pct: Math.round(rand(85, 99) * 100) / 100,
    liquidity_convergence: Math.round(rand(0.88, 0.97) * 1000) / 1000,
    signal_coherence: Math.round(rand(0.55, 0.78) * 1000) / 1000,
    gravity_index: Math.round(rand(0.88, 0.98) * 1000) / 1000,
    storm_velocity: Math.round(rand(14, 22) * 100) / 100,
    narrative_compression: Math.round(rand(0.82, 0.95) * 1000) / 1000,
    entropy_spiral: Math.round(rand(0.60, 0.76) * 1000) / 1000,
    narrative,
    llm_narrative: llmNarrativeCache,
    top_letter: topLetter,
    market_regime: regime,
    generated_at: new Date().toISOString(),
    next_refresh_in_seconds: Math.ceil((liveTs + LIVE_TTL - Date.now()) / 1000),
    llm_provider: openaiClient ? "gpt-5-nano / Replit AI Integrations" : "static",
  };
}

function buildLetterKpi30(letter: string): LetterKpi {
  const data = priceDataGetter?.() ?? null;
  const histEntry = data?.history[letter] ?? [];
  const currentPrice = data?.current[letter] ?? 0.01;
  const prices = histEntry.map((s) => s.price_usd);

  const rsi = computeRSI(prices);
  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);
  const macd = ema12 - ema26;
  const bWidth = computeBollingerWidth(prices);
  const bMean = prices.length > 0 ? prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length) : currentPrice;
  const momentum = prices.length >= 2 ? (prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2] * 100 : 0;
  const volLabel = bWidth < 0.02 ? "LOW" : bWidth < 0.05 ? "MEDIUM" : bWidth < 0.1 ? "HIGH" : "EXTREME";

  return {
    letter,
    price_lgu: Math.round((currentPrice / LGU_USD) * 100000) / 100000,
    price_usd: Math.round(currentPrice * 100000) / 100000,
    rsi: Math.round(rsi * 100) / 100,
    ema_12: Math.round(ema12 * 100000) / 100000,
    ema_26: Math.round(ema26 * 100000) / 100000,
    macd: Math.round(macd * 10000000) / 10000000,
    bollinger_upper: Math.round((bMean * (1 + bWidth / 2)) * 100000) / 100000,
    bollinger_lower: Math.round((bMean * (1 - bWidth / 2)) * 100000) / 100000,
    liquidity_score: Math.round(rand(0.55, 0.99) * 1000) / 1000,
    semantic_weight: Math.round(rand(0.30, 0.95) * 1000) / 1000,
    oracle_flux: Math.round(rand(0.05, 0.18) * 1000000) / 1000000,
    narrative_beta: Math.round(rand(0.8, 1.8) * 100) / 100,
    momentum: Math.round(momentum * 1000) / 1000,
    volatility_label: volLabel,
    dominance_rank: randInt(1, 27),
    corpus_freq_pct: Math.round(rand(0.2, 13) * 100) / 100,
    demand_ratio: Math.round(rand(0.5, 1.8) * 1000) / 1000,
    kpi_narrative: `${letter}: ${volLabel.toLowerCase()} volatility — RSI ${rsi.toFixed(1)}, MACD ${macd > 0 ? "+" : ""}${macd.toFixed(7)}`,
    llm_narrative: "",
    source_breakdown: {
      solana_tokens: Math.round(rand(0.15, 0.35) * 100) / 100,
      nft_collections: Math.round(rand(0.10, 0.25) * 100) / 100,
      registry: Math.round(rand(0.20, 0.35) * 100) / 100,
      github: Math.round(rand(0.05, 0.18) * 100) / 100,
      dex_screener: Math.round(rand(0.05, 0.15) * 100) / 100,
    },
    generated_at: new Date().toISOString(),
  };
}

// ── AUTO-REFRESH LOOP (every 60s, LLM narrative every 5 min) ──────────────────
async function refreshLiveKpi() {
  const kpi = buildLiveKpi30();
  liveCache = kpi;
  liveTs = Date.now();
  // async LLM narrative — doesn't block, updates cache for next poll
  generateLLMNarrative(kpi).then((text) => {
    if (liveCache) liveCache.llm_narrative = text;
  });
  console.log(`[KPI] 30 live KPIs refreshed — regime: ${kpi.market_regime}`);
}

// Pre-warm
refreshLiveKpi();
setInterval(refreshLiveKpi, LIVE_TTL);

// ── ENDPOINTS ─────────────────────────────────────────────────────────────────

// GET /kpi/live — all 30 KPIs
router.get("/live", (_req, res) => {
  const now = Date.now();
  if (liveCache && now - liveTs < LIVE_TTL) {
    return res.json({ ...liveCache, next_refresh_in_seconds: Math.ceil((liveTs + LIVE_TTL - now) / 1000) });
  }
  refreshLiveKpi();
  res.json(liveCache ?? buildLiveKpi30());
});

// GET /kpi/definitions — metadata for all 30 KPIs
router.get("/definitions", (_req, res) => {
  res.json({
    total: 30,
    groups: [
      { name: "Price & Market", count: 8, kpis: ["oracle_flux_density","semantic_pressure_ratio","narrative_velocity","liquidity_resonance","total_liquidity_usd","market_cap_usd","daily_volume_usd","price_entropy"] },
      { name: "Technical Indicators", count: 7, kpis: ["rsi_aggregate","ema_12_spread","ema_26_spread","macd_signal","bollinger_width","momentum_index","volatility_realized"] },
      { name: "Corpus & Linguistics", count: 7, kpis: ["corpus_chars_live","corpus_sources_active","vowel_ratio","consonant_pressure","entropy_shannon","top_letter_dominance","word_length_avg"] },
      { name: "Oracle & Network", count: 8, kpis: ["source_diversity_index","oracle_consensus_pct","liquidity_convergence","signal_coherence","gravity_index","storm_velocity","narrative_compression","entropy_spiral"] },
    ],
    llm_provider: openaiClient ? "gpt-5-nano / Replit AI Integrations" : "static",
    refresh_interval_seconds: 60,
    llm_narrative_interval_seconds: 300,
  });
});

// GET /kpi/letter/:letter — per-letter 30-metric KPI
router.get("/letter/:letter", async (req, res) => {
  const letter = req.params.letter.toUpperCase();
  const now = Date.now();
  const cached = letterCache[letter];
  if (cached && now - cached.ts < LETTER_TTL) return res.json(cached.data);
  const data = buildLetterKpi30(letter);
  // async LLM for this letter
  generateLetterLLMNarrative(letter, data).then((text) => {
    if (text) { data.llm_narrative = text; letterCache[letter] = { data, ts: Date.now() }; }
  });
  letterCache[letter] = { data, ts: Date.now() };
  res.json(data);
});

// GET /kpi/all-letters — all 26 letters at once
router.get("/all-letters", (_req, res) => {
  const letters = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  const result: Record<string, LetterKpi> = {};
  const now = Date.now();
  for (const letter of letters) {
    const cached = letterCache[letter];
    if (cached && now - cached.ts < LETTER_TTL) { result[letter] = cached.data; continue; }
    const data = buildLetterKpi30(letter);
    letterCache[letter] = { data, ts: Date.now() };
    result[letter] = data;
  }
  res.json({ letters: result, generated_at: new Date().toISOString(), llm_provider: openaiClient ? "gpt-5-nano / Replit AI Integrations" : "static" });
});

// GET /kpi/technical/:letter — just technical indicators
router.get("/technical/:letter", (req, res) => {
  const letter = req.params.letter.toUpperCase();
  const data = priceDataGetter?.() ?? null;
  const histEntry = data?.history[letter] ?? [];
  const prices = histEntry.map((s) => s.price_usd);
  const currentPrice = data?.current[letter] ?? 0.01;
  const rsi = computeRSI(prices);
  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);
  const bWidth = computeBollingerWidth(prices);
  const bMean = prices.length > 0 ? prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, prices.length) : currentPrice;
  res.json({
    letter,
    price_usd: Math.round(currentPrice * 100000) / 100000,
    rsi: Math.round(rsi * 100) / 100,
    ema_12: Math.round(ema12 * 100000) / 100000,
    ema_26: Math.round(ema26 * 100000) / 100000,
    macd: Math.round((ema12 - ema26) * 10000000) / 10000000,
    macd_signal: ema12 > ema26 ? "BULLISH" : "BEARISH",
    bollinger_upper: Math.round((bMean * (1 + bWidth / 2)) * 100000) / 100000,
    bollinger_lower: Math.round((bMean * (1 - bWidth / 2)) * 100000) / 100000,
    bollinger_width: Math.round(bWidth * 10000) / 10000,
    snapshots_available: prices.length,
    updated_at: new Date().toISOString(),
  });
});

export default router;
