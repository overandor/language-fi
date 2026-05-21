import { useState, useEffect, useRef } from "react";

const BASE_URL_DISPLAY = typeof window !== "undefined"
  ? `${window.location.origin}`
  : "https://api.membra.io";

const ENDPOINTS = [
  // ── Primitives & Letters ──────────────────────────────────────────────────
  { method: "GET", path: "/api/primitives", name: "All Primitives", category: "Primitives", price: 0.010, desc: "Oracle prices, ranks, and confidence scores for all A–Z, 0–9, SPACE, and symbol primitives.", params: [], example: `{"items":[{"symbol":"E","price_lgu":0.1421,"price_usd":0.0124,"rank":1}],"updated_at":"..."}` },
  { method: "GET", path: "/api/primitives/:symbol", name: "Primitive Detail", category: "Primitives", price: 0.014, desc: "Full oracle breakdown for a single primitive: 5 weighted source scores, Gate.io tokens, weekly market, settlement proofs.", params: [{ name: "symbol", in: "path", type: "string", desc: "Letter A–Z, digit 0–9, or SPACE", required: true }], example: `{"symbol":"S","price_lgu":0.916,"oracle_sources":{...},"gateio_tokens":[...]}` },
  { method: "GET", path: "/api/letters", name: "Letter Grid", category: "Primitives", price: 0.010, desc: "Full A–Z + SPACE grid with oracle prices, usage counts, trend direction, and leaderboard ranks.", params: [], example: `{"letters":[{"letter":"E","current_price":0.142,"rank":"#1"}],"updated_at":"..."}` },
  { method: "GET", path: "/api/letter/:letter", name: "Letter Detail", category: "Primitives", price: 0.013, desc: "Comprehensive oracle stats for a single letter: rank, confidence, historical position, source breakdown.", params: [{ name: "letter", in: "path", type: "string", desc: "Single letter A–Z", required: true }], example: `{"letter":"A","current_price":0.09,"rank":"#4","volatility":"LOW"}` },
  { method: "GET", path: "/api/protocol-breakdown/:letter", name: "Protocol Breakdown", category: "Primitives", price: 0.013, desc: "Weighted oracle source contributions for a letter.", params: [{ name: "letter", in: "path", type: "string", required: true, desc: "Single letter A–Z" }], example: `[{"name":"Gate.io","usage":1910,"change":2.1},...]` },
  { method: "GET", path: "/api/appraisal/:letter", name: "Full Price Appraisal", category: "Primitives", price: 0.015, desc: "Full corpus-derived USD price derivation: demand_ratio, rarity_premium, demand_premium, per-source breakdown.", params: [{ name: "letter", in: "path", type: "string", required: true, desc: "Single letter A–Z" }], example: `{"letter":"E","price_usd":0.01162,"derivation":{"demand_ratio":1.02,"demand_premium":0.0003}}` },
  { method: "GET", path: "/api/space-price", name: "SPACE Price", category: "Primitives", price: 0.010, desc: "Current oracle price and metadata for the SPACE separator primitive.", params: [], example: `{"symbol":"SPACE","price_usd":0.024,"price_lgu":0.0276}` },
  // ── Market & Oracle ───────────────────────────────────────────────────────
  { method: "GET", path: "/api/market/overview", name: "Market Overview", category: "Market", price: 0.010, desc: "Total liquidity (LGU + USD), market cap, daily volume, market regime, dominant letter, vowel ratio.", params: [], example: `{"total_liquidity_usd":0.61,"market_cap_usd":323500000,"market_regime":"SURGE"}` },
  { method: "GET", path: "/api/market/volatility-index", name: "Volatility Index", category: "Market", price: 0.012, desc: "Composite volatility score across all letter primitives with per-letter breakdown.", params: [], example: `{"composite_index":0.0312,"regime":"MODERATE","by_letter":{"E":0.012,...}}` },
  { method: "GET", path: "/api/market/top-movers", name: "Top Movers (24H)", category: "Market", price: 0.010, desc: "Top 5 gainers and top 5 losers by percentage change in the last 24 hours.", params: [], example: `{"top_gainers":[{"symbol":"Z","change_pct":0.44}],"top_losers":[...]}` },
  { method: "GET", path: "/api/market/liquidity-flow", name: "Liquidity Flow", category: "Market", price: 0.011, desc: "Net LGU/USD inflow and outflow across all letter primitives.", params: [], example: `{"inflow_usd":145000,"outflow_usd":98000,"net_flow_usd":47000}` },
  { method: "GET", path: "/api/ticker", name: "Live Ticker", category: "Market", price: 0.010, desc: "Streaming ticker data for all 44 primitives — price_usd, change_pct, sparkline (12 points).", params: [], example: `{"items":[{"symbol":"E","price_usd":0.01162,"change_pct":0.20,"sparkline":[...]}]}` },
  { method: "GET", path: "/api/settlements", name: "Settlements", category: "Market", price: 0.010, desc: "Recent oracle settlement events with proof hashes and consensus timestamps.", params: [], example: `{"settlements":[{"letter":"E","proof_hash":"0xabc...","status":"confirmed"}]}` },
  // ── Oracle ────────────────────────────────────────────────────────────────
  { method: "GET", path: "/api/oracle/flux-density", name: "Oracle Flux Density", category: "Oracle", price: 0.011, desc: "Source price intensity adjusted by primitive volume across the oracle network.", params: [], example: `{"value":0.114947,"delta_pct":2.3,"unit":"USD/source-hour"}` },
  { method: "GET", path: "/api/oracle/semantic-pressure", name: "Semantic Pressure", category: "Oracle", price: 0.011, desc: "Cross-source semantic pressure ratio measuring narrative consensus strength.", params: [], example: `{"value":65.085,"delta_pct":-1.2,"unit":"ratio"}` },
  { method: "GET", path: "/api/oracle/narrative-velocity", name: "Narrative Velocity", category: "Oracle", price: 0.011, desc: "Rate of change in linguistic narrative consensus (narratives/hour).", params: [], example: `{"value":165.4,"delta_pct":3.1,"unit":"narratives/hour"}` },
  { method: "GET", path: "/api/oracle/liquidity-resonance", name: "Liquidity Resonance", category: "Oracle", price: 0.011, desc: "Cross-source liquidity alignment index.", params: [], example: `{"value":0.730,"delta_pct":0.8}` },
  { method: "GET", path: "/api/oracle/source-diversity", name: "Source Diversity", category: "Oracle", price: 0.010, desc: "Active source count, health by category, and aggregate diversity score.", params: [], example: `{"value":0.778,"active_sources":6,"total_sources":9}` },
  // ── History ────────────────────────────────────────────────────────────────
  { method: "GET", path: "/api/history/:symbol", name: "Price History", category: "History", price: 0.015, desc: "288-point price history (last 24h at 5-min intervals) in LGU and USD. Stored in-memory, updated every corpus refresh.", params: [{ name: "symbol", in: "path", type: "string", required: true, desc: "Letter A–Z or SPACE" }], example: `{"symbol":"E","current_price_usd":0.01162,"change_24h_pct":0.20,"snapshots":[{"ts":1747...,"price_usd":0.01150,"volume_24h":52000},...]}` },
  // ── KPI ───────────────────────────────────────────────────────────────────
  { method: "GET", path: "/api/kpi/live", name: "Live 30 KPIs", category: "KPI", price: 0.018, desc: "All 30 live KPIs across 4 groups: Price & Market (8), Technical Indicators (7 — RSI, EMA, MACD, Bollinger), Corpus & Linguistics (7), Oracle & Network (8). LLM narrative via GPT-5-nano.", params: [], example: `{"rsi_aggregate":51.2,"macd_signal":0.0000012,"bollinger_width":0.038,"narrative_velocity":165,"llm_narrative":"Oracle flux...","market_regime":"SURGE"}` },
  { method: "GET", path: "/api/kpi/definitions", name: "KPI Definitions", category: "KPI", price: 0.005, desc: "Metadata for all 30 KPIs: groups, descriptions, LLM provider, refresh intervals.", params: [], example: `{"total":30,"groups":[{"name":"Technical Indicators","kpis":["rsi_aggregate","macd_signal",...]}]}` },
  { method: "GET", path: "/api/kpi/letter/:letter", name: "Letter KPI", category: "KPI", price: 0.016, desc: "Per-letter 30-metric KPI: RSI, EMA 12/26, MACD, Bollinger bands, momentum, demand_ratio, LLM narrative.", params: [{ name: "letter", in: "path", type: "string", required: true, desc: "Single letter A–Z" }], example: `{"letter":"E","rsi":52.4,"macd":0.0000012,"bollinger_width":0.031,"llm_narrative":"E showing..."}` },
  { method: "GET", path: "/api/kpi/all-letters", name: "All Letter KPIs", category: "KPI", price: 0.020, desc: "All 26 letter KPIs in one call.", params: [], example: `{"letters":{"E":{"rsi":52.4,"macd":0.0000012},...}}` },
  { method: "GET", path: "/api/kpi/technical/:letter", name: "Technical Indicators", category: "KPI", price: 0.012, desc: "Just the technical indicators for one letter: RSI, EMA 12/26, MACD signal, Bollinger bands.", params: [{ name: "letter", in: "path", type: "string", required: true, desc: "Single letter A–Z" }], example: `{"letter":"A","rsi":49.1,"ema_12":0.00921,"macd_signal":"BULLISH","bollinger_width":0.029}` },
  // ── Analytics ─────────────────────────────────────────────────────────────
  { method: "GET", path: "/api/analytics/letter-frequency", name: "Letter Frequency", category: "Analytics", price: 0.012, desc: "Expected vs observed frequency for each letter with demand_ratio, price, and corpus metadata.", params: [], example: `{"letters":[{"letter":"E","freq_pct":12.7,"english_baseline_pct":12.7,"demand_ratio":1.0}],"total_chars":17723}` },
  { method: "GET", path: "/api/analytics/divergence", name: "Divergence Analysis", category: "Analytics", price: 0.012, desc: "Most divergent letter pairs whose oracle prices diverge from linguistic baseline.", params: [], example: `{"pairs":[{"pair":"Z/SPACE","divergence":0.21},...]}` },
  { method: "GET", path: "/api/analytics/entropy", name: "Shannon Entropy", category: "Analytics", price: 0.012, desc: "Shannon entropy H of the primitive distribution, normalized against maximum entropy.", params: [], example: `{"shannon_entropy":4.1047,"max_entropy":"4.7004","normalized":0.8732}` },
  { method: "GET", path: "/api/corpus/snapshot", name: "Corpus Snapshot", category: "Analytics", price: 0.015, desc: "Raw corpus state: letter counts, frequencies, demand ratios, prices, and live source status for all 9 real data sources.", params: [], example: `{"total_chars":17723,"active_sources":6,"letters":[{"letter":"E","count":1812,"demand_ratio":1.02}],"sources":[...]}` },
  // ── Sentences ─────────────────────────────────────────────────────────────
  { method: "POST", path: "/api/calculate-sentence-price", name: "Calculate Price", category: "Sentences", price: 0.011, desc: "Compute grouped character breakdown + minting fee for any sentence in LGU and USD.", params: [{ name: "sentence", in: "body", type: "string", required: true, desc: "Any text string" }], example: `{"sentence":"HELLO","total_usd":0.0412,"minting_fee_usd":0.0049}` },
  { method: "POST", path: "/api/sentences/quote", name: "Sentence Quote", category: "Sentences", price: 0.010, desc: "Fast grouped quote for a sentence: base value and oracle timestamp.", params: [{ name: "sentence", in: "body", type: "string", required: true, desc: "Any text string" }], example: `{"quote_usd":0.0412,"oracle_ts":"2026-05-21T..."}` },
  { method: "POST", path: "/api/sentences/validate", name: "Validate Sentence", category: "Sentences", price: 0.010, desc: "Corpus-derived USD price per character, breakdown table, total + minting fee.", params: [{ name: "sentence", in: "body", type: "string", required: true, desc: "Any text string" }], example: `{"sentence":"MEMBRA","price_usd":0.0731,"breakdown":[{"char":"M","price_usd":0.0117},...]}` },
  { method: "POST", path: "/api/stake-sentence", name: "Stake Sentence", category: "Sentences", price: 0.015, desc: "Full stake simulation with diversity multiplier, anti-spam score, character performance.", params: [{ name: "sentence", in: "body", type: "string", required: true, desc: "Sentence to stake" }], example: `{"staked":true,"total_value_usd":0.0731,"diversity_multiplier":1.23,"spam_score":0.05}` },
  { method: "POST", path: "/api/staking/sentence-score", name: "Sentence Score", category: "Sentences", price: 0.015, desc: "Detailed staking score with top_contributors, diversity breakdown, anti-spam analysis.", params: [{ name: "sentence", in: "body", type: "string", required: true, desc: "Sentence to score" }], example: `{"diversity_score":0.82,"anti_spam_score":0.95,"top_contributors":["E","T","A"]}` },
  { method: "POST", path: "/api/transfer-sentence", name: "Transfer Sentence", category: "Sentences", price: 0.012, desc: "Hard or vaulted transfer simulation with stillness preservation calculation.", params: [{ name: "sentence", in: "body", type: "string", required: true, desc: "Sentence to transfer" }, { name: "mode", in: "body", type: "string", required: false, desc: '"hard" or "vaulted"' }], example: `{"transferred":true,"mode":"hard","stillness_preserved_pct":87.2}` },
  // ── Leaderboards ──────────────────────────────────────────────────────────
  { method: "GET", path: "/api/sentence-leaderboard", name: "Sentence Leaderboard", category: "Leaderboard", price: 0.010, desc: "Top staked sentences by formula value with owner, stillness days, and stake date.", params: [], example: `{"entries":[{"sentence":"DEFI IS THE FUTURE","value_usd":0.842,"stillness_days":12}]}` },
  { method: "GET", path: "/api/leaderboard/words", name: "Word Leaderboard", category: "Leaderboard", price: 0.010, desc: "Top single-word primitives ranked by total oracle value in LGU and USD.", params: [], example: `{"words":[{"word":"BITCOIN","price_usd":0.412,"staked_count":1842}]}` },
  // ── Solana ────────────────────────────────────────────────────────────────
  { method: "GET", path: "/api/solana/tokens", name: "All SPL Tokens", category: "Solana", price: 0.013, desc: "SPL token mint addresses for all 26 letter primitives on Solana devnet with supply and price.", params: [], example: `{"tokens":[{"letter":"A","mint_address":"3x4...","network":"devnet","price_usd":0.00921}],"rpc":"https://api.devnet.solana.com"}` },
  { method: "GET", path: "/api/solana/token/:letter", name: "Letter SPL Token", category: "Solana", price: 0.014, desc: "Full SPL token metadata for a specific letter: mint address, holders, transfers, explorer URL.", params: [{ name: "letter", in: "path", type: "string", required: true, desc: "Single letter A–Z" }], example: `{"letter":"M","mint_address":"9xKp...","holders":4821,"transactions_24h":1243,"explorer_url":"https://explorer.solana.com/..."}` },
  // ── Info ──────────────────────────────────────────────────────────────────
  { method: "GET", path: "/api/sources", name: "Data Sources", category: "Info", price: 0.010, desc: "Full directory of all 33 oracle data sources with live status, chars extracted, weights, latency.", params: [], example: `{"total_sources":33,"active_sources":6,"sources":[{"name":"GitHub Trending","status":"live","chars_extracted":3420},...]}` },
  { method: "GET", path: "/api/pricing", name: "API Pricing", category: "Info", price: 0.010, desc: "Per-call prices for all endpoints in USD plus tier plans.", params: [], example: `{"endpoints":[{"path":"/api/kpi/live","cost_usd":0.0005}],"currency":"USD"}` },
  { method: "GET", path: "/api/service-valuation", name: "Service Valuation", category: "Info", price: 0.010, desc: "MEMBRA platform ARR estimate, API calls per month, gross margin.", params: [], example: `{"monthly_value_usd":49.00,"annual_value_usd":588.00,"api_calls_per_month":1200000}` },
  { method: "GET", path: "/api/status", name: "System Status", category: "Info", price: 0.010, desc: "Full system health: corpus chars, active sources, price symbols tracked, history snapshots.", params: [], example: `{"status":"operational","version":"2.0.0","corpus_chars":17723,"corpus_sources_active":6}` },
];

const CATEGORIES = ["All", ...Array.from(new Set(ENDPOINTS.map((e) => e.category)))];

const METHOD_COLORS: Record<string, string> = { GET: "#34D399", POST: "#F59E0B", PUT: "#A78BFA", DELETE: "#F87171" };

export default function DocsPage() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trialPath, setTrialPath] = useState<string | null>(null);
  const [trialBody, setTrialBody] = useState("{}");
  const [trialResult, setTrialResult] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [pricing, setPricing] = useState<{ base_price_per_call: number; service_monthly_usd?: number } | null>(null);
  const [search, setSearch] = useState("");
  const trialRef = useRef<HTMLTextAreaElement>(null);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    fetch(`${base}/api/pricing`).then((r) => r.json()).then((d) => setPricing({ base_price_per_call: d.endpoints?.[0]?.cost_usd ?? 0.0001, service_monthly_usd: 49 })).catch(() => {});
  }, [base]);

  const filtered = (filter === "All" ? ENDPOINTS : ENDPOINTS.filter((e) => e.category === filter))
    .filter((e) => !search || e.path.toLowerCase().includes(search.toLowerCase()) || e.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (path: string) => {
    setExpanded((e) => e === path ? null : path);
    setTrialPath(null);
    setTrialResult(null);
  };

  const runTrial = async (ep: typeof ENDPOINTS[0]) => {
    setTrialLoading(true);
    setTrialResult(null);
    try {
      let url = `${base}${ep.path.replace(/:symbol/, "E").replace(/:letter/, "E").replace(/:sentence/, "")}`;
      const opts: RequestInit = { method: ep.method };
      if (ep.method === "POST") {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = trialBody;
      }
      const r = await fetch(url, opts);
      const data = await r.json();
      setTrialResult(JSON.stringify(data, null, 2).slice(0, 1200) + (JSON.stringify(data).length > 1200 ? "\n... (truncated)" : ""));
    } catch (e) {
      setTrialResult(`Error: ${e}`);
    }
    setTrialLoading(false);
  };

  return (
    <div style={{ padding: "6rem 1.5rem 4rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.16em", marginBottom: "0.5rem" }}>◈ MEMBRA — API REFERENCE</div>
        <h1 className="section-title">SWAGGER DOCUMENTATION</h1>
        <p className="section-subtitle">{ENDPOINTS.length} endpoints · JSON · Live "Try it" runner · 9 real data sources · 30 KPIs · LLM narratives</p>
      </div>

      {/* Stats */}
      {pricing && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "TOTAL ENDPOINTS", value: ENDPOINTS.length },
            { label: "GET ENDPOINTS", value: ENDPOINTS.filter(e => e.method === "GET").length, color: "#34D399" },
            { label: "POST ENDPOINTS", value: ENDPOINTS.filter(e => e.method === "POST").length, color: "var(--primary)" },
            { label: "DATA SOURCES", value: 9, color: "#A78BFA" },
          ].map((s) => (
            <div key={s.label} className="neo-stat">
              <div className="neo-stat-label">{s.label}</div>
              <div className="neo-stat-value" style={{ color: s.color ?? "var(--primary)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Base URL card */}
      <div className="neo-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginBottom: 6 }}>BASE URL</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--primary)", background: "var(--surface-deep)", padding: "10px 14px", borderRadius: 8, boxShadow: "var(--neo-shadow-inset)", marginBottom: 10 }}>
          {BASE_URL_DISPLAY}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
          {[
            { k: "AUTH", v: "Bearer token or API key" },
            { k: "FORMAT", v: "JSON · UTF-8" },
            { k: "RATE LIMIT", v: "1,000 req/day (free)" },
          ].map((r) => (
            <div key={r.k} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-text)" }}>
              <span style={{ color: "var(--dim-text)" }}>{r.k}: </span>{r.v}
            </div>
          ))}
        </div>
      </div>

      {/* Search + category filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search endpoints…"
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", color: "var(--soft-white)", outline: "none", minWidth: 220 }}
        />
      </div>
      <div className="primitives-filter-bar" style={{ marginBottom: "1.25rem" }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`filter-btn${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>
            {c} {c !== "All" && `(${ENDPOINTS.filter(e => e.category === c).length})`}
          </button>
        ))}
      </div>

      {/* Endpoint list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map((ep) => (
          <div key={ep.path} style={{ background: "var(--surface)", border: `1px solid ${expanded === ep.path ? "var(--border-bright)" : "var(--border)"}`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s" }}>
            {/* Row */}
            <div onClick={() => toggle(ep.path)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: `${METHOD_COLORS[ep.method]}22`, color: METHOD_COLORS[ep.method], border: `1px solid ${METHOD_COLORS[ep.method]}44`, flexShrink: 0, minWidth: 42, textAlign: "center" }}>
                {ep.method}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--primary)", flexShrink: 0, minWidth: 260 }}>{ep.path}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)", flex: 1 }}>{ep.name}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", flexShrink: 0 }}>${ep.price.toFixed(3)}/call</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginLeft: 8 }}>{expanded === ep.path ? "▲" : "▼"}</span>
            </div>

            {/* Expanded detail */}
            {expanded === ep.path && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px" }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)", marginBottom: "1rem", lineHeight: 1.6 }}>{ep.desc}</p>

                {/* Parameters table */}
                {ep.params.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--primary)", letterSpacing: "0.1em", marginBottom: 6 }}>PARAMETERS</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
                      <thead>
                        <tr style={{ color: "var(--dim-text)" }}>
                          {["Name", "In", "Type", "Required", "Description"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ep.params.map((p) => (
                          <tr key={p.name}>
                            <td style={{ padding: "4px 8px", color: "var(--primary)" }}>{p.name}</td>
                            <td style={{ padding: "4px 8px", color: "var(--muted-text)" }}>{p.in}</td>
                            <td style={{ padding: "4px 8px", color: "#A78BFA" }}>{p.type}</td>
                            <td style={{ padding: "4px 8px", color: p.required ? "#34D399" : "var(--dim-text)" }}>{p.required ? "yes" : "no"}</td>
                            <td style={{ padding: "4px 8px", color: "var(--muted-text)" }}>{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Response example */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--primary)", letterSpacing: "0.1em", marginBottom: 6 }}>EXAMPLE RESPONSE</div>
                  <pre style={{ background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#A78BFA", overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {ep.example}
                  </pre>
                </div>

                {/* Try it */}
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--primary)", letterSpacing: "0.1em", marginBottom: 6 }}>TRY IT</div>
                  {ep.method === "POST" && (
                    <textarea
                      ref={trialRef}
                      value={trialPath === ep.path ? trialBody : ep.params.find(p => p.in === "body") ? `{"${ep.params.find(p => p.in === "body")!.name}": "HELLO MEMBRA"}` : "{}"}
                      onChange={(e) => { setTrialPath(ep.path); setTrialBody(e.target.value); }}
                      style={{ width: "100%", height: 64, background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--soft-white)", resize: "vertical", outline: "none", marginBottom: 8 }}
                    />
                  )}
                  <button onClick={() => runTrial(ep)} disabled={trialLoading} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, padding: "6px 16px", background: "var(--primary)", color: "#000", border: "none", borderRadius: 5, cursor: trialLoading ? "not-allowed" : "pointer", opacity: trialLoading ? 0.6 : 1 }}>
                    {trialLoading ? "Running…" : `▶ Try ${ep.method} ${ep.path.replace(/:symbol/, "E").replace(/:letter/, "E")}`}
                  </button>
                  {trialResult && (
                    <pre style={{ marginTop: 8, background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#34D399", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}>
                      {trialResult}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "2rem", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", textAlign: "center" }}>
        {ENDPOINTS.length} endpoints · {ENDPOINTS.filter(e => e.method === "GET").length} GET · {ENDPOINTS.filter(e => e.method === "POST").length} POST · avg ${(ENDPOINTS.reduce((s, e) => s + e.price, 0) / ENDPOINTS.length).toFixed(3)}/call
      </div>
    </div>
  );
}
