import { useState, useEffect } from "react";

const ENDPOINTS = [
  // Primitives & Letters
  { method: "GET", path: "/api/primitives", name: "All Primitives", desc: "Oracle prices, ranks, and confidence scores for all A-Z, 0-9, SPACE, and symbol primitives.", price: 0.010, category: "Primitives" },
  { method: "GET", path: "/api/primitives/:symbol", name: "Primitive Detail", desc: "Full oracle breakdown for a single primitive: 5 weighted source scores, Gate.io tokens, weekly market, settlement proofs, price decomposition.", price: 0.014, category: "Primitives" },
  { method: "GET", path: "/api/letters", name: "Letter Grid", desc: "Full A-Z + SPACE grid with oracle prices, usage counts, trend direction, and leaderboard ranks.", price: 0.010, category: "Primitives" },
  { method: "GET", path: "/api/letter/:letter", name: "Letter Detail", desc: "Comprehensive oracle stats for a single letter: rank, confidence, historical position, source breakdown.", price: 0.013, category: "Primitives" },
  { method: "GET", path: "/api/protocol-breakdown/:letter", name: "Protocol Breakdown", desc: "Weighted oracle source contributions for a letter: Solana tokens, NFTs, domains, registry, Gate.io.", price: 0.013, category: "Primitives" },
  { method: "GET", path: "/api/space-price", name: "SPACE Price", desc: "Current oracle price and metadata for the SPACE separator primitive.", price: 0.010, category: "Primitives" },
  // Market & Oracle
  { method: "GET", path: "/api/market/overview", name: "Market Overview", desc: "Total liquidity (LGU + USD), market cap, daily volume, market regime, dominant letter, vowel ratio.", price: 0.010, category: "Market" },
  { method: "GET", path: "/api/market/volatility-index", name: "Volatility Index", desc: "Composite volatility score across all letter primitives with per-letter breakdown.", price: 0.012, category: "Market" },
  { method: "GET", path: "/api/market/top-movers", name: "Top Movers (24H)", desc: "Top 5 gainers and top 5 losers by percentage change in the last 24 hours.", price: 0.010, category: "Market" },
  { method: "GET", path: "/api/market/liquidity-flow", name: "Liquidity Flow", desc: "Net LGU/USD inflow and outflow across all letter primitives with top movers.", price: 0.011, category: "Market" },
  { method: "GET", path: "/api/ticker", name: "Live Ticker", desc: "Streaming ticker data for all 44 primitives — price, USD value, 24h change.", price: 0.010, category: "Market" },
  { method: "GET", path: "/api/settlements", name: "Settlements", desc: "Recent oracle settlement events with proof hashes and consensus timestamps.", price: 0.010, category: "Market" },
  // Oracle
  { method: "GET", path: "/api/oracle/flux-density", name: "Oracle Flux Density", desc: "Source price intensity adjusted by primitive volume across the oracle network.", price: 0.011, category: "Oracle" },
  { method: "GET", path: "/api/oracle/semantic-pressure", name: "Semantic Pressure", desc: "Cross-source semantic pressure ratio measuring narrative consensus strength.", price: 0.011, category: "Oracle" },
  { method: "GET", path: "/api/oracle/narrative-velocity", name: "Narrative Velocity", desc: "Rate of change in linguistic narrative consensus (narratives/hour).", price: 0.011, category: "Oracle" },
  { method: "GET", path: "/api/oracle/liquidity-resonance", name: "Liquidity Resonance", desc: "Cross-source liquidity alignment index: how in-sync all 30 data sources are.", price: 0.011, category: "Oracle" },
  { method: "GET", path: "/api/oracle/source-diversity", name: "Source Diversity", desc: "Active source count, health by category, and aggregate diversity score.", price: 0.010, category: "Oracle" },
  // History
  { method: "GET", path: "/api/history/:symbol", name: "Price History", desc: "288-point price history (last 24h at 5-min intervals) in LGU and USD for any primitive. Like CoinMarketCap history.", price: 0.015, category: "History" },
  // Analytics
  { method: "GET", path: "/api/analytics/letter-frequency", name: "Letter Frequency", desc: "Expected vs observed frequency for each letter, with entropy and vowel/consonant ratio.", price: 0.012, category: "Analytics" },
  { method: "GET", path: "/api/analytics/divergence", name: "Divergence Analysis", desc: "Most divergent letter pairs — letters whose oracle prices diverge most from their linguistic baseline.", price: 0.012, category: "Analytics" },
  { method: "GET", path: "/api/analytics/entropy", name: "Shannon Entropy", desc: "Shannon entropy H of the primitive distribution, normalized against maximum entropy.", price: 0.012, category: "Analytics" },
  // Sentences
  { method: "POST", path: "/api/calculate-sentence-price", name: "Calculate Price", desc: "Compute grouped character breakdown + minting fee for any sentence in LGU and USD.", price: 0.011, category: "Sentences" },
  { method: "POST", path: "/api/sentences/quote", name: "Sentence Quote", desc: "Fast grouped quote for a sentence: base value and oracle timestamp.", price: 0.010, category: "Sentences" },
  { method: "POST", path: "/api/sentences/validate", name: "Validate Sentence", desc: "Check a sentence for spam, diversity, and length constraints before staking.", price: 0.010, category: "Sentences" },
  { method: "POST", path: "/api/stake-sentence", name: "Stake Sentence", desc: "Full stake simulation with stillness multiplier, diversity multiplier, and anti-spam score.", price: 0.015, category: "Sentences" },
  { method: "POST", path: "/api/staking/sentence-score", name: "Sentence Score", desc: "Detailed staking score with top_contributors, diversity breakdown, anti-spam analysis.", price: 0.015, category: "Sentences" },
  { method: "POST", path: "/api/transfer-sentence", name: "Transfer Sentence", desc: "Hard or vaulted transfer simulation with stillness preservation calculation.", price: 0.012, category: "Sentences" },
  // Leaderboards
  { method: "GET", path: "/api/sentence-leaderboard", name: "Sentence Leaderboard", desc: "Top staked sentences by formula value with owner, stillness days, and stake date.", price: 0.010, category: "Leaderboard" },
  { method: "GET", path: "/api/leaderboard/words", name: "Word Leaderboard", desc: "Top single-word primitives ranked by total oracle value in LGU and USD.", price: 0.010, category: "Leaderboard" },
  // Solana
  { method: "GET", path: "/api/solana/tokens", name: "All Solana Tokens", desc: "SPL token mint addresses for all 44 letter primitives on Solana devnet with supply and price.", price: 0.013, category: "Solana" },
  { method: "GET", path: "/api/solana/token/:letter", name: "Letter SPL Token", desc: "Full SPL token metadata for a specific letter: mint address, holders, transfers, explorer URL.", price: 0.014, category: "Solana" },
  // KPI
  { method: "GET", path: "/api/kpi/live", name: "Live KPI Stream", desc: "LLM-generated market narrative and 10 oracle KPI metrics. Refreshes every 60s via Transformers.js.", price: 0.018, category: "KPI" },
  { method: "GET", path: "/api/kpi/letter/:letter", name: "Letter KPI", desc: "Per-letter LLM KPI narrative + liquidity score, semantic weight, oracle flux, narrative beta.", price: 0.016, category: "KPI" },
  // Info
  { method: "GET", path: "/api/sources", name: "Data Sources", desc: "Full directory of all 30 oracle data sources: Gate.io, Binance, CoinGecko, Reddit, and 26 more.", price: 0.010, category: "Info" },
  { method: "GET", path: "/api/pricing", name: "API Pricing", desc: "Current per-call prices for all endpoints in USD, plus tier plans and service valuation.", price: 0.010, category: "Info" },
  { method: "GET", path: "/api/service-valuation", name: "Service Valuation", desc: "MEMBRA platform DCF valuation, ARR estimate, gross margin, and growth metrics.", price: 0.010, category: "Info" },
  { method: "GET", path: "/api/status", name: "System Status", desc: "Full system health: uptime, latency P50/P99, active sources, primitives tracked, services.", price: 0.010, category: "Info" },
];

const CATEGORIES = ["All", ...Array.from(new Set(ENDPOINTS.map((e) => e.category)))];

const RESPONSE_EXAMPLES: Record<string, string> = {
  "/api/ticker": `{ "items": [{ "symbol": "E", "price_lgu": 0.1421, "price_usd": 0.1236, "weekly_change": 0.0321 }], "updated_at": "2026-05-18T..." }`,
  "/api/market/overview": `{ "total_liquidity_usd": 3204518.24, "market_cap_usd": 318204750.00, "market_regime": "EXPANSION", "dominant_letter": "S" }`,
  "/api/history/:symbol": `{ "symbol": "E", "current_price_usd": 0.1236, "change_24h_pct": 3.21, "snapshots": [{ "ts": 1747531200000, "price_lgu": 0.142, "price_usd": 0.124 }, ...] }`,
  "/api/sources": `{ "total_sources": 30, "active_sources": 28, "sources": [{ "name": "Gate.io", "category": "Exchange", "weight": 0.08, "status": "live" }, ...] }`,
  "/api/kpi/live": `{ "oracle_flux_density": 0.114947, "semantic_pressure_ratio": 65.085, "narrative": "Semantic liquidity convergence...", "market_regime": "EXPANSION" }`,
};

export default function DocsPage() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{ base_price_per_call: number; service_monthly_usd: number; service_valuation_usd: number } | null>(null);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    fetch(`${base}/api/pricing`).then((r) => r.json()).then(setPricing).catch(() => {});
  }, [base]);

  const filtered = filter === "All" ? ENDPOINTS : ENDPOINTS.filter((e) => e.category === filter);
  const toggle = (path: string) => setExpanded((e) => (e === path ? null : path));

  return (
    <div className="docs-page">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.16em", marginBottom: "0.75rem" }}>◈ MEMBRA</div>
        <h1 className="section-title">API DOCUMENTATION</h1>
        <p className="section-subtitle">
          {ENDPOINTS.length} endpoints. All responses in JSON. Dynamic USD pricing based on oracle primitive weights.
        </p>
      </div>

      {/* Pricing cards */}
      {pricing && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "BASE PRICE/CALL", value: `$${pricing.base_price_per_call.toFixed(3)}`, desc: "Minimum per API call" },
            { label: "SERVICE/MONTH", value: `$${pricing.service_monthly_usd.toFixed(0)}`, desc: "Pro tier · 100k calls/day" },
            { label: "PLATFORM VALUATION", value: `$${(pricing.service_valuation_usd / 1000).toFixed(0)}K`, desc: "DCF 10× ARR estimate" },
          ].map((s) => (
            <div key={s.label} className="neo-stat">
              <div className="neo-stat-label">{s.label}</div>
              <div className="neo-stat-value">{s.value}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginTop: 3 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Base URL */}
      <div className="neo-card" style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginBottom: 6 }}>BASE URL</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--primary)", background: "var(--surface-deep)", padding: "10px 14px", borderRadius: 8, boxShadow: "var(--neo-shadow-inset)", marginBottom: "0.75rem" }}>
          https://api.membra.io/v1
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)" }}>
            <span style={{ color: "var(--dim-text)" }}>AUTH: </span>Bearer token or API key
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)" }}>
            <span style={{ color: "var(--dim-text)" }}>FORMAT: </span>JSON
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)" }}>
            <span style={{ color: "var(--dim-text)" }}>RATE LIMIT: </span>1000 req/day (free)
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="primitives-filter-bar" style={{ marginBottom: "1.5rem" }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`filter-btn${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>
            {c} {c !== "All" && `(${ENDPOINTS.filter((e) => e.category === c).length})`}
          </button>
        ))}
      </div>

      {/* Endpoint list */}
      <div>
        {filtered.map((ep) => (
          <div key={ep.path} className="docs-endpoint" onClick={() => toggle(ep.path)} style={{ cursor: "pointer" }}>
            <div className="docs-endpoint-header">
              <span className={`http-badge ${ep.method}`}>{ep.method}</span>
              <span className="endpoint-path">{ep.path}</span>
              <span className="endpoint-name">{ep.name}</span>
              <span className="endpoint-price">${ep.price.toFixed(3)}/call</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginLeft: "auto" }}>
                {expanded === ep.path ? "▲" : "▼"}
              </span>
            </div>
            <div className="endpoint-desc">{ep.desc}</div>
            {expanded === ep.path && RESPONSE_EXAMPLES[ep.path] && (
              <div className="docs-response-box">{RESPONSE_EXAMPLES[ep.path]}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--dim-text)", textAlign: "center" }}>
        {ENDPOINTS.length} endpoints listed • {ENDPOINTS.filter((e) => e.method === "GET").length} GET • {ENDPOINTS.filter((e) => e.method === "POST").length} POST
        {" • "}Average price: ${(ENDPOINTS.reduce((s, e) => s + e.price, 0) / ENDPOINTS.length).toFixed(3)}/call
      </div>
    </div>
  );
}
