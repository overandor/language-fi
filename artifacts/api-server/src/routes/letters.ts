import { Router } from "express";

const router = Router();

const BASE_PRICES: Record<string, number> = {
  E: 0.142, T: 0.185, A: 0.142, O: 0.085, N: 0.072,
  I: 0.095, R: 0.068, S: 0.105, H: 0.062, L: 0.058,
  D: 0.062, C: 0.118, U: 0.045, M: 0.075, W: 0.058,
  F: 0.052, G: 0.048, Y: 0.072, P: 0.065, B: 0.091,
  V: 0.042, K: 0.045, J: 0.038, X: 0.035, Q: 0.032, Z: 0.028,
  SPACE: 0.061,
  "0": 0.041, "1": 0.043, "2": 0.037, "3": 0.039, "4": 0.038,
  "5": 0.040, "6": 0.035, "7": 0.033, "8": 0.036, "9": 0.034,
  ".": 0.015, "!": 0.018, "?": 0.016, "-": 0.012, "_": 0.014,
  "@": 0.022, "#": 0.020,
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max));
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return String(num);
}

function generateLetterData() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const protocols = ["Solana", "Ethereum", "Base", "Bitcoin Ordinals"];
  const volatilities = ["Low", "Medium", "High"];

  const letters = Array.from(alphabet).map((letter, i) => {
    const base = BASE_PRICES[letter] ?? 0.05;
    const change = rand(-15, 25);
    const price = base * (1 + change / 100);
    const weeklyUsage = randInt(500000, 3500000);
    const longPct = randInt(40, 80);
    return {
      letter,
      price: Math.round(price * 1000) / 1000,
      change_24h: Math.round(change * 10) / 10,
      weekly_usage: formatNumber(weeklyUsage),
      rank: `#${i + 1}`,
      long_pct: `${longPct}%`,
      short_pct: `${100 - longPct}%`,
      top_protocol: protocols[randInt(0, 4)],
      trend: change > 0 ? "↑" : "↓",
      volatility: volatilities[randInt(0, 3)],
    };
  });

  const spaceBase = BASE_PRICES["SPACE"] ?? 0.012;
  const spaceChange = rand(-5, 20);
  const spaceLong = randInt(50, 75);
  letters.push({
    letter: "SPACE",
    price: Math.round(spaceBase * (1 + spaceChange / 100) * 1000) / 1000,
    change_24h: Math.round(spaceChange * 10) / 10,
    weekly_usage: formatNumber(randInt(800000, 2500000)),
    rank: "#27",
    long_pct: `${spaceLong}%`,
    short_pct: `${100 - spaceLong}%`,
    top_protocol: "Solana",
    trend: spaceChange > 0 ? "↑" : "↓",
    volatility: "Medium",
  });

  return letters;
}

function generateLetterDetail(letter: string) {
  const base = BASE_PRICES[letter] ?? 0.05;
  const weeklyUsage = randInt(500000, 3500000);
  const prevWeekUsage = Math.floor(weeklyUsage * rand(0.8, 1.2));
  const weeklyChange = ((weeklyUsage - prevWeekUsage) / prevWeekUsage) * 100;
  return {
    letter,
    current_price: Math.round(base * 1000) / 1000,
    weekly_usage: weeklyUsage,
    prev_week_usage: prevWeekUsage,
    weekly_change: Math.round(weeklyChange * 100) / 100,
    rank: `#${randInt(1, 27)}`,
    volatility: ["Low", "Medium", "High"][randInt(0, 3)],
    congestion_tax: ["Active", "Inactive"][randInt(0, 2)],
    long_interest: `${randInt(40, 80)}%`,
    top_protocol: ["Solana", "Ethereum", "Base"][randInt(0, 3)],
  };
}

function generateProtocolBreakdown(letter: string) {
  const protocols = [
    { name: "Solana", base: 150000 },
    { name: "Ethereum", base: 100000 },
    { name: "Base", base: 180000 },
    { name: "Bitcoin Ordinals", base: 40000 },
    { name: "Gate.io Tokens", base: 1200 },
    { name: "Language.fi Registry", base: 88000 },
    { name: "NYT Sample", base: 67000 },
    { name: "Hash Baseline", base: 54000 },
  ];
  return protocols.map((p) => ({
    name: p.name,
    usage: Math.floor(p.base * rand(0.7, 1.5)),
    change: Math.round(rand(-10, 35) * 100) / 100,
  }));
}

function generateSettlements() {
  const markets = ["B / Base", "E / Solana", "T / Ethereum", "A / Solana", "S / Base"];
  return markets.map((market, i) => {
    const prev = randInt(100000, 200000);
    const curr = Math.floor(prev * rand(0.9, 1.3));
    const change = ((curr - prev) / prev) * 100;
    return {
      market: `${market} / Week ${18 - i}`,
      prev_window: `Apr ${20 - i * 7}–${26 - i * 7}`,
      curr_window: `Apr ${27 - i * 7}–May ${3 - i * 7}`,
      prev_usage: prev,
      curr_usage: curr,
      change: Math.round(change * 100) / 100,
      winning_side: change > 0 ? "Long" : "Short",
      status: "Finalized",
    };
  });
}

const cache: Record<string, { data: unknown; ts: number }> = {};
const TTL = 300000;

function cached<T>(key: string, fn: () => T): T {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < TTL) return cache[key].data as T;
  const data = fn();
  cache[key] = { data, ts: now };
  return data;
}

router.get("/letters", (_req, res) => {
  res.json(cached("letters", generateLetterData));
});

router.get("/letter/:letter", (req, res) => {
  const letter = req.params.letter.toUpperCase();
  res.json(cached(`letter_${letter}`, () => generateLetterDetail(letter)));
});

router.get("/protocol-breakdown/:letter", (req, res) => {
  const letter = req.params.letter.toUpperCase();
  res.json(cached(`protocol_${letter}`, () => generateProtocolBreakdown(letter)));
});

router.get("/settlements", (_req, res) => {
  res.json(cached("settlements", generateSettlements));
});

router.get("/space-price", (_req, res) => {
  res.json(cached("space_price", () => ({
    character: "SPACE",
    price: Math.round(rand(0.008, 0.018) * 1000) / 1000,
    change_24h: Math.round(rand(-5, 20) * 10) / 10,
    weekly_usage: formatNumber(randInt(800000, 2500000)),
    rank: "#4",
    description: "Linguistic separator token",
  })));
});

router.post("/calculate-sentence-price", (req, res) => {
  const { sentence = "" } = req.body;
  const upper = sentence.toUpperCase();
  let total = 0;
  const chars: { symbol: string; count: number; unit_price_lgu: number; total: number }[] = [];
  for (const char of upper) {
    const key = char === " " ? "SPACE" : char;
    const price = BASE_PRICES[key] ?? 0.03;
    total += price;
    chars.push({ symbol: key, count: 1, unit_price_lgu: Math.round(price * 1000) / 1000, total: Math.round(price * 1000) / 1000 });
  }
  res.json({ sentence, characters: chars, base_value_lgu: Math.round(total * 1000) / 1000 });
});

router.post("/sentences/quote", (req, res) => {
  const { sentence = "" } = req.body;
  const upper = sentence.toUpperCase();
  let baseValue = 0;
  const characters: { symbol: string; count: number; unit_price_lgu: number; total: number }[] = [];
  for (const char of upper) {
    const key = char === " " ? "SPACE" : char;
    const price = BASE_PRICES[key] ?? 0.03;
    baseValue += price;
    characters.push({ symbol: key, count: 1, unit_price_lgu: Math.round(price * 1000) / 1000, total: Math.round(price * 1000) / 1000 });
  }
  res.json({
    sentence,
    characters,
    base_value_lgu: Math.round(baseValue * 1000) / 1000,
    oracle_updated_at: new Date().toISOString(),
  });
});

router.post("/stake-sentence", (req, res) => {
  const { sentence = "" } = req.body;
  if (!sentence) return res.status(400).json({ error: "Sentence required" });
  const upper = sentence.toUpperCase();
  let baseValue = 0;
  for (const char of upper) {
    const key = char === " " ? "SPACE" : char;
    baseValue += BASE_PRICES[key] ?? 0.03;
  }
  const stillnessDays = 73;
  const stillnessMultiplier = 1 + stillnessDays * 0.002;
  const weeklyPerf = rand(0.05, 0.15);
  const finalScore = baseValue * (1 + weeklyPerf) * stillnessMultiplier;
  res.json({
    sentence,
    base_value_lgu: Math.round(baseValue * 1000) / 1000,
    stillness_days: stillnessDays,
    stillness_multiplier: Math.round(stillnessMultiplier * 1000) / 1000,
    weekly_performance: Math.round(weeklyPerf * 1000) / 1000,
    final_staking_score: Math.round(finalScore * 1000) / 1000,
  });
});

router.get("/sentence-leaderboard", (_req, res) => {
  const sentences = [
    "THE QUICK BROWN FOX",
    "LANGUAGE IS LIQUIDITY",
    "BITCOIN MADE NUMBERS SCARCE",
    "EVERY LETTER HAS A PRICE",
    "PROTOCOL PRIMITIVES",
    "SEMANTIC CURRENCY",
    "WORDS ARE ASSETS",
    "MINT YOUR MEANING",
  ];
  const leaderboard = sentences.map((s, i) => {
    let value = 0;
    for (const c of s) {
      const key = c === " " ? "SPACE" : c;
      value += BASE_PRICES[key] ?? 0.03;
    }
    return {
      rank: i + 1,
      sentence: s,
      formula_value_lgu: Math.round(value * 100) / 100,
      staked_since: `2026-${String(randInt(1, 5)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
      stillness_days: randInt(20, 150),
      owner: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
    };
  });
  res.json(leaderboard);
});

router.get("/primitives", (_req, res) => {
  res.json(cached("primitives", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = [".", "!", "?", "-", "_", "@", "#"];
    const all = [
      ...Array.from(alphabet).map((s) => ({ symbol: s, type: "letter" })),
      ...Array.from(numbers).map((s) => ({ symbol: s, type: "number" })),
      { symbol: "SPACE", type: "separator" },
      ...symbols.map((s) => ({ symbol: s, type: "symbol" })),
    ].map((p) => {
      const price = BASE_PRICES[p.symbol] ?? 0.03;
      const weeklyChange = rand(-0.05, 0.20);
      return {
        symbol: p.symbol,
        type: p.type,
        price_lgu: Math.round(price * (1 + weeklyChange) * 1000) / 1000,
        weekly_change: Math.round(weeklyChange * 1000) / 1000,
        usage_count: randInt(200000, 4000000),
        rank: 1,
      };
    });
    return { updated_at: new Date().toISOString(), primitives: all };
  }));
});

export default router;
