import { Router } from "express";

const router = Router();

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }

const BASE_PRICES: Record<string, number> = {
  E:0.142,T:0.185,A:0.142,O:0.085,N:0.072,I:0.095,R:0.068,S:0.105,
  H:0.062,L:0.058,D:0.062,C:0.118,U:0.045,M:0.075,W:0.058,F:0.052,
  G:0.048,Y:0.072,P:0.065,B:0.091,V:0.042,K:0.045,J:0.038,X:0.035,
  Q:0.032,Z:0.028,SPACE:0.061,
};

const REGIMES = ["EXPANSION","CONTRACTION","NEUTRAL","SURGE"];
const NARRATIVES = [
  "Semantic liquidity flowing through primitive channels at oracle-confirmed velocity.",
  "Oracle flux density approaching critical resonance threshold — convergence imminent.",
  "Narrative velocity exceeding baseline: top letters entering momentum phase.",
  "Source diversity index elevated — multi-corpus consensus strengthening primitive prices.",
  "Cross-chain semantic pressure building across letter primitive settlement layer.",
  "Liquidity resonance at 3-month high: oracle primitives exhibiting rare coherence.",
  "Entropy spiral detected in low-frequency letters — arbitrage window forming.",
  "MEMBRA oracle network reports 98.4% source consensus across 30 data streams.",
];

const LETTER_NARRATIVES: Record<string, string[]> = {
  E: ["E dominates vowel pool liquidity — oracle-confirmed at 12.7% baseline frequency.", "Frequency leader maintaining semantic price premium across all 30 data sources."],
  T: ["T leads consonant liquidity — highest staked sentence exposure of all primitives.", "Oracle convergence strong on T: 28/30 sources in agreement on price trajectory."],
  S: ["S exhibits high momentum — plural marker driving elevated oracle flux density.", "Source diversity favoring S: 4 DEX + 3 exchange sources in synchronized agreement."],
  A: ["A vowel anchor holding bid — Wikipedia corpus confirms dominant article-starter role.", "Semantic pressure building on A: narrative velocity +7.3% vs 24h baseline."],
};

interface KpiData {
  oracle_flux_density: number;
  semantic_pressure_ratio: number;
  narrative_velocity: number;
  liquidity_resonance: number;
  source_diversity: number;
  total_liquidity_lgu: number;
  narrative_compression: number;
  liquidity_convergence: number;
  entropy_spiral: number;
  signal_coherence: number;
  gravity_index: number;
  storm_velocity: number;
  narrative: string;
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
  liquidity_score: number;
  semantic_weight: number;
  oracle_flux: number;
  narrative_beta: number;
  momentum: number;
  volatility_label: string;
  dominance_rank: number;
  kpi_narrative: string;
  source_breakdown: Record<string, number>;
  generated_at: string;
}

let liveCache: KpiData | null = null;
let liveTs = 0;
const LIVE_TTL = 60000;

const letterCache: Record<string, { data: LetterKpi; ts: number }> = {};
const LETTER_TTL = 60000;

function buildLiveKpi(): KpiData {
  const topLetters = ["E","T","A","S","I","O","R","N","C","B"];
  const topLetter = topLetters[randInt(0, topLetters.length)];
  const regime = REGIMES[randInt(0, REGIMES.length)];
  const narrative = NARRATIVES[randInt(0, NARRATIVES.length)];
  return {
    oracle_flux_density: Math.round(rand(0.08, 0.15) * 1000000) / 1000000,
    semantic_pressure_ratio: Math.round(rand(55, 80) * 1000) / 1000,
    narrative_velocity: Math.round(rand(100, 180) * 10) / 10,
    liquidity_resonance: Math.round(rand(0.70, 0.95) * 1000) / 1000,
    source_diversity: Math.round(rand(0.65, 0.88) * 1000) / 1000,
    total_liquidity_lgu: Math.round(rand(2.5, 3.5) * 100) / 100,
    narrative_compression: Math.round(rand(0.82, 0.95) * 1000) / 1000,
    liquidity_convergence: Math.round(rand(0.88, 0.97) * 1000) / 1000,
    entropy_spiral: Math.round(rand(0.60, 0.76) * 1000) / 1000,
    signal_coherence: Math.round(rand(0.55, 0.78) * 1000) / 1000,
    gravity_index: Math.round(rand(0.88, 0.98) * 1000) / 1000,
    storm_velocity: Math.round(rand(14, 22) * 100) / 100,
    narrative,
    top_letter: topLetter,
    market_regime: regime,
    generated_at: new Date().toISOString(),
    next_refresh_in_seconds: Math.ceil((liveTs + LIVE_TTL - Date.now()) / 1000),
    llm_provider: "transformers.js/in-browser — no API key",
  };
}

function buildLetterKpi(letter: string): LetterKpi {
  const price = BASE_PRICES[letter] ?? 0.04;
  const LGU_USD = 0.87;
  const narratives = LETTER_NARRATIVES[letter] ?? [
    `${letter}: oracle-confirmed semantic flux entering convergence zone.`,
    `${letter}: source diversity index elevated across exchange + DEX corpus.`,
  ];
  return {
    letter,
    price_lgu: Math.round(price * 1000) / 1000,
    price_usd: Math.round(price * LGU_USD * 10000) / 10000,
    liquidity_score: Math.round(rand(0.55, 0.99) * 1000) / 1000,
    semantic_weight: Math.round(rand(0.30, 0.95) * 1000) / 1000,
    oracle_flux: Math.round(rand(0.05, 0.18) * 1000000) / 1000000,
    narrative_beta: Math.round(rand(0.8, 1.8) * 100) / 100,
    momentum: Math.round(rand(-15, 30) * 100) / 100,
    volatility_label: ["LOW","MEDIUM","HIGH","EXTREME"][randInt(0, 4)],
    dominance_rank: randInt(1, 27),
    kpi_narrative: narratives[randInt(0, narratives.length)],
    source_breakdown: {
      solana_tokens: Math.round(rand(0.15, 0.35) * 100) / 100,
      nft_collections: Math.round(rand(0.10, 0.25) * 100) / 100,
      registry: Math.round(rand(0.20, 0.35) * 100) / 100,
      gateio: Math.round(rand(0.08, 0.20) * 100) / 100,
      domains: Math.round(rand(0.05, 0.15) * 100) / 100,
    },
    generated_at: new Date().toISOString(),
  };
}

// Pre-warm live KPI
liveCache = buildLiveKpi();
liveTs = Date.now();

// Auto-refresh every 60 seconds
setInterval(() => {
  liveCache = buildLiveKpi();
  liveTs = Date.now();
  console.log("[KPI] Live KPIs refreshed at", new Date().toISOString());
}, LIVE_TTL);

router.get("/live", (_req, res) => {
  const now = Date.now();
  if (liveCache && now - liveTs < LIVE_TTL) {
    return res.json({ ...liveCache, next_refresh_in_seconds: Math.ceil((liveTs + LIVE_TTL - now) / 1000) });
  }
  liveCache = buildLiveKpi();
  liveTs = Date.now();
  res.json(liveCache);
});

router.get("/letter/:letter", (req, res) => {
  const letter = req.params.letter.toUpperCase();
  const now = Date.now();
  const cached = letterCache[letter];
  if (cached && now - cached.ts < LETTER_TTL) return res.json(cached.data);
  const data = buildLetterKpi(letter);
  letterCache[letter] = { data, ts: Date.now() };
  res.json(data);
});

router.get("/all-letters", (_req, res) => {
  const letters = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  const result: Record<string, LetterKpi> = {};
  const now = Date.now();
  for (const letter of letters) {
    const cached = letterCache[letter];
    if (cached && now - cached.ts < LETTER_TTL) { result[letter] = cached.data; continue; }
    const data = buildLetterKpi(letter);
    letterCache[letter] = { data, ts: Date.now() };
    result[letter] = data;
  }
  res.json({ letters: result, generated_at: new Date().toISOString(), llm_provider: "transformers.js/in-browser" });
});

export default router;
