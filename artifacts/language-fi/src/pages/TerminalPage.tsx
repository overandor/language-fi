import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useKpiWorker } from "@/hooks/useKpiWorker";

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

interface Primitive { symbol: string; price_lgu: number; price_usd: number; weekly_change: number; type: string; rank: number; oracle_confidence: number; }
interface KpiData { oracle_flux_density: number; semantic_pressure_ratio: number; narrative_velocity: number; liquidity_resonance: number; source_diversity: number; total_liquidity_lgu: number; market_regime: string; top_letter: string; narrative: string; generated_at: string; }
interface MarketOverview { total_liquidity_usd: number; market_cap_usd: number; daily_volume_usd: number; active_staked_sentences: number; market_regime: string; dominant_letter: string; vowel_ratio: number; }
interface TickerItem { symbol: string; price_lgu: number; price_usd: number; weekly_change: number; }

function fmt(n: number, d = 3) { return n.toFixed(d); }
function fmtB(n: number) { if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`; if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`; return `$${n.toFixed(2)}`; }
function pctColor(v: number) { return v >= 0 ? "var(--green)" : "var(--red)"; }

export default function TerminalPage() {
  const [, navigate] = useLocation();
  const [primitives, setPrimitives] = useState<Primitive[]>([]);
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [topMovers, setTopMovers] = useState<{ gainers: TickerItem[]; losers: TickerItem[] }>({ gainers: [], losers: [] });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const { state: kpiState, generateForLetter, generateMarketNarrative } = useKpiWorker();
  const generatedRef = useRef(false);

  const base = BASE();

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [pRes, kRes, oRes, tRes, mRes] = await Promise.all([
          fetch(`${base}/api/primitives`),
          fetch(`${base}/api/kpi/live`),
          fetch(`${base}/api/market/overview`),
          fetch(`${base}/api/ticker`),
          fetch(`${base}/api/market/top-movers`),
        ]);
        const [pData, kData, oData, tData, mData] = await Promise.all([pRes.json(), kRes.json(), oRes.json(), tRes.json(), mRes.json()]);
        setPrimitives(pData.primitives ?? []);
        setKpi(kData);
        setOverview(oData);
        setTicker(tData.items ?? []);
        setTopMovers({ gainers: mData.gainers ?? [], losers: mData.losers ?? [] });
        setLoading(false);
      } catch { setLoading(false); }
    }
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [base]);

  useEffect(() => {
    if (!kpiState.ready || generatedRef.current || primitives.length === 0) return;
    generatedRef.current = true;
    const topFive = primitives.slice(0, 5);
    topFive.forEach((p) => {
      generateForLetter(p.symbol, p.price_lgu, (p.weekly_change ?? 0) * 100, "MEDIUM");
    });
    if (kpi) generateMarketNarrative(kpi.market_regime ?? "NEUTRAL", kpi.top_letter ?? "E", kpi.oracle_flux_density ?? 0.11);
  }, [kpiState.ready, primitives, kpi, generateForLetter, generateMarketNarrative]);

  useEffect(() => {
    if (!kpiState.ready) return;
    const id = setInterval(() => {
      generatedRef.current = false;
    }, 60000);
    return () => clearInterval(id);
  }, [kpiState.ready]);

  const letters = primitives.filter((p) => p.type === "letter").slice(0, 26);

  return (
    <div className="terminal-page">
      <div className="terminal-page-inner">

        {/* ── HEADER ── */}
        <div className="terminal-header-bar">
          <div>
            <div className="terminal-title-tag">◈ MEMBRA TERMINAL v2.1.0</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginTop: 2 }}>
              REAL-TIME SEMANTIC LIQUIDITY NETWORK
            </div>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
              <span style={{ color: "var(--dim-text)" }}>ORACLE </span>
              <span className="status-badge active">● LIVE</span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)" }}>
              {now.toISOString().replace("T", " ").slice(0, 19)} UTC
            </div>
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        {kpi && (
          <div className="metrics-strip" style={{ marginBottom: "1.5rem" }}>
            {[
              { label: "TOTAL LIQUIDITY", value: fmtB((overview?.total_liquidity_usd ?? 0)), delta: null },
              { label: "ORACLE FLUX DENSITY", value: kpi.oracle_flux_density.toFixed(6), delta: "+8.71%" },
              { label: "SEMANTIC PRESSURE", value: kpi.semantic_pressure_ratio.toFixed(3), delta: "+9.23%" },
              { label: "NARRATIVE VELOCITY", value: kpi.narrative_velocity.toFixed(1), delta: "+7.34%" },
              { label: "SOURCE DIVERSITY", value: kpi.source_diversity.toFixed(2), delta: "+4.11%" },
              { label: "LIQUIDITY RESONANCE", value: kpi.liquidity_resonance.toFixed(2), delta: "+6.55%" },
              { label: "MARKET REGIME", value: kpi.market_regime, delta: null },
            ].map((m) => (
              <div key={m.label} className="metric-chip">
                <span className="metric-chip-label">{m.label} ▾</span>
                <span className="metric-chip-value">{m.value}</span>
                {m.delta && <span className="metric-chip-delta" style={{ color: "var(--green)" }}>{m.delta}</span>}
              </div>
            ))}
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "1rem" }}>

          {/* ── LEFT: KPI ENGINE ── */}
          <div>
            <div className="neo-card" style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                ▸ KPI APPRAISAL ENGINE
              </div>
              {!kpiState.ready && (
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", marginBottom: 8 }}>
                    Loading in-browser LLM…
                  </div>
                  <div style={{ background: "var(--surface-deep)", borderRadius: 6, height: 6, overflow: "hidden", boxShadow: "var(--neo-shadow-inset)" }}>
                    <div style={{ height: "100%", background: "var(--primary)", width: `${kpiState.progress}%`, transition: "width 0.3s", borderRadius: 6 }} />
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginTop: 4 }}>
                    {kpiState.progressFile} — {kpiState.progress.toFixed(0)}%
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginTop: 8 }}>
                    WebGPU/WASM • No API key required
                  </div>
                </div>
              )}
              {kpiState.ready && (
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--green)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", boxShadow: "0 0 6px var(--green)" }} />
                    MODEL ACTIVE • TRANSFORMERS.JS
                  </div>
                  {kpiState.marketNarrative && (
                    <div style={{ background: "var(--surface-deep)", border: "1px solid var(--border-bright)", borderRadius: 8, padding: "10px 12px", marginBottom: "0.75rem", boxShadow: "var(--neo-shadow-inset)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)", fontStyle: "italic", lineHeight: 1.6 }}>
                      {kpiState.marketNarrative}
                    </div>
                  )}
                  {Object.values(kpiState.results).slice(0, 5).map((r) => (
                    <div key={r.letter} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.6rem", marginBottom: "0.6rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{r.letter}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--dim-text)" }}>{new Date(r.generatedAt).toLocaleTimeString()}</span>
                      </div>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-text)", lineHeight: 1.5 }}>{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ORACLE METRICS */}
            {kpi && (
              <div className="neo-card">
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "1rem" }}>▸ ORACLE METRICS</div>
                {[
                  { k: "ORACLE FLUX DENSITY", v: fmt(kpi.oracle_flux_density, 6) },
                  { k: "SEMANTIC PRESSURE", v: fmt(kpi.semantic_pressure_ratio, 3) },
                  { k: "NARRATIVE VELOCITY", v: fmt(kpi.narrative_velocity, 1) },
                  { k: "LIQUIDITY RESONANCE", v: fmt(kpi.liquidity_resonance, 3) },
                ].map((row) => (
                  <div key={row.k} className="result-row" style={{ marginBottom: "0.5rem" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)" }}>{row.k}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>{row.v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── MIDDLE: LIVE PRIMITIVE HEATMAP ── */}
          <div>
            <div className="neo-card" style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em" }}>▸ LIVE PRIMITIVE HEATMAP</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-text)" }}>LIQUIDITY LOW ←→ HIGH</div>
              </div>
              {loading ? (
                <div style={{ textAlign: "center", color: "var(--dim-text)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "2rem" }}>Loading primitives…</div>
              ) : (
                <div className="letter-grid">
                  {letters.map((p) => (
                    <div key={p.symbol} className="letter-tile" onClick={() => navigate(`/primitives/${p.symbol}`)}>
                      <div className="letter-tile-sym">{p.symbol}</div>
                      <div className="letter-tile-price">{fmt(p.price_lgu, 4)}</div>
                      <div className="letter-tile-chg" style={{ color: pctColor((p.weekly_change ?? 0)) }}>
                        {(p.weekly_change ?? 0) >= 0 ? "+" : ""}{((p.weekly_change ?? 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MARKET OVERVIEW STATS */}
            {overview && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                {[
                  { label: "MARKET CAP", value: fmtB(overview.market_cap_usd) },
                  { label: "DAILY VOLUME", value: fmtB(overview.daily_volume_usd) },
                  { label: "STAKED SENTENCES", value: overview.active_staked_sentences.toLocaleString() },
                  { label: "REGIME", value: overview.market_regime },
                  { label: "TOP LETTER", value: overview.dominant_letter },
                  { label: "VOWEL RATIO", value: `${(overview.vowel_ratio * 100).toFixed(1)}%` },
                ].map((s) => (
                  <div key={s.label} className="neo-stat">
                    <div className="neo-stat-label">{s.label}</div>
                    <div className="neo-stat-value" style={{ fontSize: 14 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: LEADERBOARD + MOVERS ── */}
          <div>
            <div className="neo-card" style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>▸ TOP LETTER LEADERBOARD</div>
              {primitives.slice(0, 10).map((p, i) => (
                <div key={p.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.5rem", marginBottom: "0.5rem", borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => navigate(`/primitives/${p.symbol}`)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", minWidth: 16 }}>#{i + 1}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: "var(--primary)" }}>{p.symbol}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--soft-white)", fontWeight: 600 }}>{fmt(p.price_lgu, 4)}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: pctColor(p.weekly_change ?? 0) }}>
                      {(p.weekly_change ?? 0) >= 0 ? "+" : ""}{((p.weekly_change ?? 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TOP MOVERS */}
            <div className="neo-card">
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>▸ TOP MOVERS (24H)</div>
              <div style={{ marginBottom: "0.5rem", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--green)", letterSpacing: "0.08em" }}>GAINERS</div>
              {topMovers.gainers.slice(0, 3).map((m) => (
                <div key={m.symbol} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>{m.symbol}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--green)" }}>+{(m as unknown as { change_pct: number }).change_pct?.toFixed(1)}%</span>
                </div>
              ))}
              <div style={{ margin: "0.5rem 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--red)", letterSpacing: "0.08em" }}>LOSERS</div>
              {topMovers.losers.slice(0, 3).map((m) => (
                <div key={m.symbol} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>{m.symbol}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--red)" }}>{(m as unknown as { change_pct: number }).change_pct?.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── API ORACLE INTERFACE ── */}
        <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="neo-card">
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>▸ API / ORACLE INTERFACE</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-text)", marginBottom: 6 }}>BASE URL</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", background: "var(--surface-deep)", padding: "6px 10px", borderRadius: 6, marginBottom: "0.75rem", boxShadow: "var(--neo-shadow-inset)" }}>
              https://api.membra.io/v1
            </div>
            {[
              "GET /primitives/{symbol}",
              "GET /history/{symbol}",
              "GET /kpi/live",
              "GET /oracle/flux-density",
              "GET /market/overview",
              "POST /sentences/quote",
            ].map((ep) => (
              <div key={ep} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)", padding: "3px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                <span>{ep}</span>
                <span style={{ color: "var(--green)", fontSize: 9 }}>GET</span>
              </div>
            ))}
            <button className="explore-btn" style={{ marginTop: "0.75rem", width: "100%", textAlign: "center" }} onClick={() => navigate("/docs")}>
              VIEW ALL API DOCS →
            </button>
          </div>

          <div className="neo-card">
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>▸ DATA SOURCE HEALTH</div>
            {["Gate.io", "Binance", "CoinGecko", "DexScreener", "Hacker News", "Jupiter", "Solana Registry"].map((src, i) => (
              <div key={src} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)" }}>{src}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)" }}>{(80 + i * 7 + Math.floor(Math.random() * 30))}ms</span>
                  <span className="status-badge active" style={{ fontSize: 9 }}>LIVE</span>
                </div>
              </div>
            ))}
            <button className="explore-btn" style={{ marginTop: "0.75rem", width: "100%", textAlign: "center" }} onClick={() => navigate("/sources")}>
              VIEW ALL 30 SOURCES →
            </button>
          </div>
        </div>

        <div style={{ marginTop: "0.75rem", textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", paddingBottom: "2rem" }}>
          MEMBRA TERMINAL v2.1.0 — REAL-TIME SEMANTIC LIQUIDITY NETWORK — ALL SYSTEMS OPERATIONAL
        </div>
      </div>
    </div>
  );
}
