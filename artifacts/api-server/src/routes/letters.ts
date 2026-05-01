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

function getSymbolType(symbol: string): string {
  if (symbol === "SPACE") return "separator";
  if (/^[A-Z]$/.test(symbol)) return "letter";
  if (/^[0-9]$/.test(symbol)) return "number";
  return "symbol";
}

function getRankForSymbol(symbol: string): number {
  const ordered = [
    "SPACE","E","T","A","O","I","R","S","H","N","L","D","C","M","W","U","B","P","G","F","Y","K","V","J","X","Q","Z",
    "1","0","2","3","4","5","6","7","8","9",
    "@","!","#","?",".","-","_",
  ];
  const idx = ordered.indexOf(symbol);
  return idx >= 0 ? idx + 1 : 99;
}

function generateOracleSources(symbol: string) {
  return {
    solana_token_names: {
      occurrences: randInt(5000, 50000),
      weight: 0.25,
    },
    solana_nft_collections: {
      occurrences: randInt(10000, 80000),
      weight: 0.20,
    },
    solana_domains: {
      occurrences: randInt(2000, 20000),
      weight: 0.15,
    },
    languagefi_registry_entries: {
      occurrences: randInt(20000, 120000),
      weight: 0.25,
    },
    gateio_token_listings: {
      occurrences: randInt(500, 3000),
      weight: 0.15,
    },
  };
}

function generatePriceBreakdown(symbol: string) {
  const base = BASE_PRICES[symbol] ?? 0.03;
  const blockchain = Math.round(rand(0.010, 0.040) * 1000) / 1000;
  const tokenName = Math.round(rand(0.005, 0.020) * 1000) / 1000;
  const content = Math.round(rand(0.003, 0.015) * 1000) / 1000;
  const hash = Math.round(rand(0.001, 0.008) * 1000) / 1000;
  const registry = Math.round(rand(0.005, 0.025) * 1000) / 1000;
  const staking = Math.round(rand(0.002, 0.010) * 1000) / 1000;
  const congestion = Math.round(rand(0.001, 0.005) * 1000) / 1000;
  return {
    base_price: 0.020,
    blockchain_usage: blockchain,
    token_name_usage: tokenName,
    regular_content: content,
    hash_address: hash,
    registry_demand: registry,
    staking_demand: staking,
    congestion_tax: congestion,
    final_price: Math.round(base * 1000) / 1000,
  };
}

function generateGateioTokens(symbol: string) {
  const tokensByLetter: Record<string, Array<{symbol: string; name: string; count: number}>> = {
    A: [{symbol:"AAVE",name:"Aave",count:2},{symbol:"APT",name:"Aptos",count:1},{symbol:"ARB",name:"Arbitrum",count:1},{symbol:"ATOM",name:"Cosmos",count:2},{symbol:"ADA",name:"Cardano",count:2},{symbol:"APE",name:"ApeCoin",count:1},{symbol:"ALGO",name:"Algorand",count:2}],
    B: [{symbol:"BTC",name:"Bitcoin",count:1},{symbol:"BNB",name:"BNB",count:2},{symbol:"ARB",name:"Arbitrum",count:1},{symbol:"BONK",name:"Bonk",count:1},{symbol:"BOME",name:"Book of Meme",count:2},{symbol:"BCH",name:"Bitcoin Cash",count:2},{symbol:"BLUR",name:"Blur",count:1}],
    C: [{symbol:"CRV",name:"Curve",count:1},{symbol:"CAKE",name:"PancakeSwap",count:1},{symbol:"COMP",name:"Compound",count:1},{symbol:"CHZ",name:"Chiliz",count:1},{symbol:"CELO",name:"Celo",count:1}],
    D: [{symbol:"DOGE",name:"Dogecoin",count:1},{symbol:"DOT",name:"Polkadot",count:1},{symbol:"DYDX",name:"dYdX",count:2},{symbol:"DASH",name:"Dash",count:1}],
    E: [{symbol:"ETH",name:"Ethereum",count:1},{symbol:"ENA",name:"Ethena",count:1},{symbol:"ENS",name:"Ethereum Name Service",count:2},{symbol:"EOS",name:"EOS",count:1}],
    F: [{symbol:"FTM",name:"Fantom",count:1},{symbol:"FLOW",name:"Flow",count:1},{symbol:"FIL",name:"Filecoin",count:1},{symbol:"FLOKI",name:"Floki",count:1}],
    G: [{symbol:"GMT",name:"STEPN",count:1},{symbol:"GRT",name:"The Graph",count:1},{symbol:"GALA",name:"Gala",count:1}],
    H: [{symbol:"HBAR",name:"Hedera",count:1},{symbol:"HFT",name:"Hashflow",count:1}],
    I: [{symbol:"ICP",name:"Internet Computer",count:1},{symbol:"IMX",name:"Immutable",count:1},{symbol:"INJ",name:"Injective",count:1}],
    J: [{symbol:"JTO",name:"Jito",count:1},{symbol:"JUP",name:"Jupiter",count:1}],
    K: [{symbol:"KAS",name:"Kaspa",count:1},{symbol:"KAVA",name:"Kava",count:1}],
    L: [{symbol:"LINK",name:"Chainlink",count:1},{symbol:"LTC",name:"Litecoin",count:1},{symbol:"LDO",name:"Lido",count:1},{symbol:"LUNA",name:"Terra Luna",count:1}],
    M: [{symbol:"MATIC",name:"Polygon",count:1},{symbol:"MKR",name:"Maker",count:1},{symbol:"MEME",name:"Memecoin",count:2}],
    N: [{symbol:"NEAR",name:"NEAR Protocol",count:1},{symbol:"NEO",name:"NEO",count:1}],
    O: [{symbol:"OP",name:"Optimism",count:1},{symbol:"OCEAN",name:"Ocean Protocol",count:1}],
    P: [{symbol:"PYTH",name:"Pyth Network",count:1},{symbol:"PENDLE",name:"Pendle",count:1},{symbol:"POL",name:"Polygon",count:1}],
    Q: [{symbol:"QNT",name:"Quant",count:1}],
    R: [{symbol:"RUNE",name:"THORChain",count:1},{symbol:"RAY",name:"Raydium",count:1},{symbol:"RVN",name:"Ravencoin",count:1}],
    S: [{symbol:"SOL",name:"Solana",count:1},{symbol:"SUI",name:"Sui",count:1},{symbol:"SNX",name:"Synthetix",count:1},{symbol:"STRK",name:"Starknet",count:1}],
    T: [{symbol:"TRX",name:"TRON",count:1},{symbol:"TON",name:"Toncoin",count:1},{symbol:"TIA",name:"Celestia",count:1}],
    U: [{symbol:"UNI",name:"Uniswap",count:1},{symbol:"USDT",name:"Tether",count:1},{symbol:"USDC",name:"USD Coin",count:1}],
    V: [{symbol:"VET",name:"VeChain",count:1},{symbol:"VELO",name:"Velodrome",count:1}],
    W: [{symbol:"WLD",name:"Worldcoin",count:1},{symbol:"WNXM",name:"Wrapped NXM",count:1}],
    X: [{symbol:"XRP",name:"XRP",count:1},{symbol:"XLM",name:"Stellar",count:1},{symbol:"XMR",name:"Monero",count:1}],
    Y: [{symbol:"YFI",name:"Yearn Finance",count:1}],
    Z: [{symbol:"ZEC",name:"Zcash",count:1},{symbol:"ZEN",name:"Horizen",count:1}],
    "0": [{symbol:"0X",name:"0x Protocol",count:1}],
    "1": [{symbol:"1INCH",name:"1inch",count:1}],
    "2": [],
    "3": [],
    "4": [],
    "5": [],
    "6": [],
    "7": [],
    "8": [],
    "9": [],
    SPACE: [],
  };
  return tokensByLetter[symbol] ?? [];
}

function generateWeeklyMarket(symbol: string) {
  const protocols = ["Solana", "Ethereum", "Base", "Bitcoin Ordinals"];
  const lastWeek = randInt(80000, 200000);
  const thisWeek = Math.floor(lastWeek * rand(0.85, 1.35));
  const change = ((thisWeek - lastWeek) / lastWeek) * 100;
  const longPool = randInt(20000, 80000);
  const shortPool = randInt(10000, 50000);
  const longPct = Math.round((longPool / (longPool + shortPool)) * 100);
  return {
    protocol: protocols[randInt(0, 4)],
    last_week_usage: lastWeek,
    this_week_usage: thisWeek,
    change_pct: Math.round(change * 100) / 100,
    long_pool_lgu: longPool,
    short_pool_lgu: shortPool,
    long_pct: longPct,
    short_pct: 100 - longPct,
    settlement_rule: `Long wins if ${symbol} usage closes above last week (${lastWeek.toLocaleString()}). Short wins if usage closes below.`,
  };
}

function generateSettlementProofs(symbol: string) {
  const protocols = ["Base", "Solana", "Ethereum"];
  return protocols.map((proto, i) => {
    const week = 18 - i;
    const prevStart = 20 - i * 7;
    const prevEnd = 26 - i * 7;
    const currStart = 27 - i * 7;
    const currEnd = 3 - i * 7;
    const prev = randInt(80000, 160000);
    const curr = Math.floor(prev * rand(0.85, 1.35));
    const change = ((curr - prev) / prev) * 100;
    return {
      market: `${symbol} / ${proto} / Week ${week}`,
      prev_window: `Apr ${prevStart}–${prevEnd}`,
      curr_window: `Apr ${currStart}–May ${currEnd}`,
      prev_usage: prev,
      curr_usage: curr,
      change_pct: Math.round(change * 100) / 100,
      winning_side: change > 0 ? "Long" : "Short",
      status: "Finalized",
    };
  });
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

  const spaceBase = BASE_PRICES["SPACE"] ?? 0.061;
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

function generateProtocolBreakdown(symbol: string) {
  const sources = [
    { name: "Solana Token Names", base: 18000 },
    { name: "Solana NFT Collections", base: 45000 },
    { name: "Solana Domains", base: 10000 },
    { name: "Language.fi Registry", base: 88000 },
    { name: "Gate.io Listings", base: 1700 },
    { name: "Hash Baseline", base: 54000 },
  ];
  return sources.map((p) => ({
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

function getStillnessMultiplier(days: number): number {
  if (days >= 365) return 3.00;
  if (days >= 181) return 2.00;
  if (days >= 91) return 1.50;
  if (days >= 31) return 1.25;
  if (days >= 8) return 1.10;
  return 1.00;
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
    price: Math.round(rand(0.050, 0.080) * 1000) / 1000,
    change_24h: Math.round(rand(-5, 20) * 10) / 10,
    weekly_usage: formatNumber(randInt(800000, 2500000)),
    rank: "#1",
    description: "Linguistic separator token",
  })));
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
    ].map((p, idx) => {
      const price = BASE_PRICES[p.symbol] ?? 0.03;
      const weeklyChange = rand(-0.05, 0.20);
      const usageCount = randInt(200000, 4000000);
      return {
        symbol: p.symbol,
        type: p.type,
        price_lgu: Math.round(price * (1 + weeklyChange) * 1000) / 1000,
        weekly_change: Math.round(weeklyChange * 1000) / 1000,
        usage_count: usageCount,
        rank: getRankForSymbol(p.symbol),
        oracle_confidence: Math.round(rand(0.90, 0.99) * 1000) / 1000,
      };
    });
    all.sort((a, b) => a.rank - b.rank);
    return { updated_at: new Date().toISOString(), primitives: all };
  }));
});

router.get("/primitives/:symbol", (req, res) => {
  const raw = req.params.symbol.toUpperCase();
  const symbol = raw === "%20" || raw === " " ? "SPACE" : raw;
  const price = BASE_PRICES[symbol];
  if (price === undefined) {
    return res.status(404).json({ error: `Unknown primitive: ${symbol}` });
  }
  res.json(cached(`primitive_${symbol}`, () => {
    const type = getSymbolType(symbol);
    const currentWeekUsage = randInt(80000, 500000);
    const prevWeekUsage = Math.floor(currentWeekUsage * rand(0.75, 1.25));
    const weeklyChange = ((currentWeekUsage - prevWeekUsage) / prevWeekUsage) * 100;
    const oracleSources = generateOracleSources(symbol);
    const totalWeighted = Math.round(
      oracleSources.solana_token_names.occurrences * 0.25 +
      oracleSources.solana_nft_collections.occurrences * 0.20 +
      oracleSources.solana_domains.occurrences * 0.15 +
      oracleSources.languagefi_registry_entries.occurrences * 0.25 +
      oracleSources.gateio_token_listings.occurrences * 0.15
    );
    const gateioTokens = generateGateioTokens(symbol);
    const weeklyMarket = generateWeeklyMarket(symbol);
    const settlementProofs = generateSettlementProofs(symbol);
    const priceBreakdown = generatePriceBreakdown(symbol);
    return {
      symbol,
      type,
      price_lgu: Math.round(price * 1000) / 1000,
      previous_price_lgu: Math.round(price * rand(0.85, 0.95) * 1000) / 1000,
      weekly_change_percent: Math.round(weeklyChange * 100) / 100,
      usage_count_current_week: currentWeekUsage,
      usage_count_previous_week: prevWeekUsage,
      rank: getRankForSymbol(symbol),
      volatility: ["low", "medium", "high"][randInt(0, 3)],
      oracle_confidence: Math.round(rand(0.920, 0.990) * 1000) / 1000,
      weighted_usage: totalWeighted,
      oracle_sources: oracleSources,
      oracle_updated_at: new Date().toISOString(),
      gateio_tokens: gateioTokens,
      gateio_stats: {
        tokens_containing: gateioTokens.length > 0 ? randInt(800, 1800) : randInt(10, 200),
        total_occurrences: gateioTokens.length > 0 ? randInt(1000, 2500) : randInt(15, 300),
        share_of_listed: Math.round(rand(5, 30) * 10) / 10,
        rank_among_all: getRankForSymbol(symbol),
      },
      weekly_market: weeklyMarket,
      settlement_proofs: settlementProofs,
      price_breakdown: priceBreakdown,
      staked_sentence_exposure: randInt(40000, 200000),
    };
  }));
});

router.post("/calculate-sentence-price", (req, res) => {
  const { sentence = "" } = req.body;
  const upper = sentence.toUpperCase();
  const counts: Record<string, number> = {};
  for (const char of upper) {
    const key = char === " " ? "SPACE" : char;
    if (BASE_PRICES[key] !== undefined) counts[key] = (counts[key] ?? 0) + 1;
  }
  let total = 0;
  const chars = Object.entries(counts).map(([symbol, count]) => {
    const unitPrice = BASE_PRICES[symbol] ?? 0.03;
    const charTotal = Math.round(unitPrice * count * 1000) / 1000;
    total += charTotal;
    return { symbol, count, unit_price_lgu: Math.round(unitPrice * 1000) / 1000, total: charTotal };
  });
  const base = Math.round(total * 1000) / 1000;
  const mintingFee = Math.round(base * 0.05 * 1000) / 1000;
  res.json({
    sentence,
    characters: chars,
    base_price: base,
    minting_fee: mintingFee,
    final_price: Math.round((base + mintingFee) * 1000) / 1000,
    character_breakdown: Object.fromEntries(
      chars.map(c => [c.symbol, { count: c.count, price: c.total }])
    ),
    oracle_updated_at: new Date().toISOString(),
  });
});

router.post("/sentences/quote", (req, res) => {
  const { sentence = "" } = req.body;
  const upper = sentence.toUpperCase();
  const counts: Record<string, number> = {};
  for (const char of upper) {
    const key = char === " " ? "SPACE" : char;
    if (BASE_PRICES[key] !== undefined) counts[key] = (counts[key] ?? 0) + 1;
  }
  let baseValue = 0;
  const characters = Object.entries(counts).map(([symbol, count]) => {
    const unitPrice = BASE_PRICES[symbol] ?? 0.03;
    const total = Math.round(unitPrice * count * 1000) / 1000;
    baseValue += total;
    return { symbol, count, unit_price_lgu: Math.round(unitPrice * 1000) / 1000, total };
  });
  res.json({
    sentence,
    characters,
    base_value_lgu: Math.round(baseValue * 1000) / 1000,
    oracle_updated_at: new Date().toISOString(),
  });
});

router.post("/stake-sentence", (req, res) => {
  const { sentence = "" } = req.body;
  if (!sentence.trim()) return res.status(400).json({ error: "Sentence required" });
  const upper = sentence.toUpperCase();
  const charCounts: Record<string, number> = {};
  for (const char of upper) {
    const key = char === " " ? "SPACE" : char;
    if (BASE_PRICES[key] !== undefined) charCounts[key] = (charCounts[key] ?? 0) + 1;
  }
  let baseValue = 0;
  const charPerf: Record<string, { weight: number; performance: number }> = {};
  const totalChars = Object.values(charCounts).reduce((a, b) => a + b, 0);
  for (const [sym, count] of Object.entries(charCounts)) {
    baseValue += (BASE_PRICES[sym] ?? 0.03) * count;
    charPerf[sym] = {
      weight: Math.round((count / totalChars) * 100),
      performance: Math.round(rand(-10, 25) * 10) / 10,
    };
  }
  const uniqueChars = Object.keys(charCounts).length;
  const diversityMultiplier = Math.min(1.0 + uniqueChars * 0.01, 1.30);
  const spamScore = Math.min(100, 50 + uniqueChars * 3 + Math.min(upper.length * 0.5, 30));
  const daysStaked = randInt(1, 180);
  const stillnessMultiplier = getStillnessMultiplier(daysStaked);
  const weeklyPerf = rand(0.04, 0.15);
  const antiSpam = Math.min(spamScore / 100, 1.0);
  const finalScore = baseValue * (1 + weeklyPerf) * stillnessMultiplier * diversityMultiplier * antiSpam;
  const hash = `st_${Math.floor(Math.random() * 900000 + 100000)}`;
  res.json({
    sentence: upper,
    sentence_hash: hash,
    base_value_lgu: Math.round(baseValue * 1000) / 1000,
    days_staked: daysStaked,
    stillness_multiplier: Math.round(stillnessMultiplier * 100) / 100,
    diversity_multiplier: Math.round(diversityMultiplier * 1000) / 1000,
    anti_spam_score: Math.round(antiSpam * 100),
    spam_score: Math.round(spamScore),
    weekly_performance: Math.round(weeklyPerf * 1000) / 1000,
    final_score: Math.round(finalScore * 10) / 10,
    final_staking_score: Math.round(finalScore * 1000) / 1000,
    character_counts: charCounts,
    character_performance: charPerf,
  });
});

router.post("/staking/sentence-score", (req, res) => {
  const { sentence_id = "", sentence = "", staked_since, last_moved_at } = req.body;
  if (!sentence.trim()) return res.status(400).json({ error: "sentence required" });
  const upper = sentence.toUpperCase();
  const charCounts: Record<string, number> = {};
  for (const char of upper) {
    const key = char === " " ? "SPACE" : char;
    if (BASE_PRICES[key] !== undefined) charCounts[key] = (charCounts[key] ?? 0) + 1;
  }
  let baseValue = 0;
  for (const [sym, count] of Object.entries(charCounts)) {
    baseValue += (BASE_PRICES[sym] ?? 0.03) * count;
  }
  const uniqueChars = Object.keys(charCounts).length;
  const diversityMultiplier = Math.min(1.0 + uniqueChars * 0.01, 1.30);
  const spamScore = Math.min(100, 50 + uniqueChars * 3 + Math.min(upper.length * 0.5, 30));
  const antiSpamScore = Math.min(spamScore / 100, 1.0);
  const movedAt = last_moved_at ? new Date(last_moved_at) : new Date(Date.now() - randInt(5, 120) * 86400000);
  const stakedSince = staked_since ? new Date(staked_since) : movedAt;
  const stillnessDays = Math.floor((Date.now() - movedAt.getTime()) / 86400000);
  const stillnessMultiplier = getStillnessMultiplier(stillnessDays);
  const weeklyCharPerf = rand(0.04, 0.15);
  const finalStakingScore = baseValue * (1 + weeklyCharPerf) * stillnessMultiplier * diversityMultiplier * antiSpamScore;
  const topContributors = Object.entries(charCounts)
    .map(([sym, count]) => ({ symbol: sym, contribution: Math.round((BASE_PRICES[sym] ?? 0.03) * count * 1000) / 1000 }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);
  res.json({
    sentence_id,
    sentence: upper,
    base_character_value_lgu: Math.round(baseValue * 1000) / 1000,
    weekly_character_performance: Math.round(weeklyCharPerf * 1000) / 1000,
    stillness_days: stillnessDays,
    stillness_multiplier: Math.round(stillnessMultiplier * 100) / 100,
    diversity_multiplier: Math.round(diversityMultiplier * 1000) / 1000,
    anti_spam_score: Math.round(antiSpamScore * 1000) / 1000,
    final_staking_score: Math.round(finalStakingScore * 1000) / 1000,
    top_contributors: topContributors,
  });
});

router.post("/transfer-sentence", (req, res) => {
  const { sentence_hash = "", transfer_type = "hard" } = req.body;
  if (!sentence_hash.trim()) return res.status(400).json({ error: "sentence_hash required" });
  const prevDays = randInt(30, 200);
  const prevMultiplier = getStillnessMultiplier(prevDays);
  let newDays: number;
  let stillnessPreserved: string;
  if (transfer_type === "vaulted") {
    newDays = Math.floor(prevDays * 0.5);
    stillnessPreserved = "50%";
  } else {
    newDays = 0;
    stillnessPreserved = "0%";
  }
  const newMultiplier = getStillnessMultiplier(newDays);
  res.json({
    sentence_hash,
    transfer_type,
    previous_stillness_days: prevDays,
    previous_multiplier: Math.round(prevMultiplier * 100) / 100,
    new_stillness_days: newDays,
    new_multiplier: Math.round(newMultiplier * 100) / 100,
    stillness_preserved: stillnessPreserved,
    transfer_status: "complete",
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

export default router;
