import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface TickerItem {
  symbol: string;
  price_usd: number;
  change_pct: number;
  type: string;
  corpus_count: number;
  sparkline: number[];
}

interface CorpusSource {
  name: string;
  category: string;
  status: string;
  chars_extracted: number;
  last_fetched: string;
  snippet: string;
}

interface CorpusSnapshot {
  total_chars: number;
  active_sources: number;
  total_sources_queried: number;
  last_full_refresh: string;
  refresh_count: number;
  letters: Array<{
    letter: string;
    count: number;
    freq_pct: number;
    english_baseline_pct: number;
    demand_ratio: number;
    price_usd: number;
  }>;
  sources: CorpusSource[];
}

function useTickerData() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [corpusChars, setCorpusChars] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/ticker`);
      const d = await r.json();
      setItems(d.items ?? []);
      setCorpusChars(d.corpus_chars ?? 0);
      setUpdatedAt(d.updated_at ?? "");
    } catch {}
  }, []);
  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 15000);
    return () => clearInterval(id);
  }, [fetch_]);
  return { items, corpusChars, updatedAt };
}

function useCorpusSnapshot() {
  const [data, setData] = useState<CorpusSnapshot | null>(null);
  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/api/corpus/snapshot`);
      setData(await r.json());
    } catch {}
  }, []);
  useEffect(() => { fetch_(); const id = setInterval(fetch_, 60000); return () => clearInterval(id); }, [fetch_]);
  return data;
}

// Animated number that flashes on change
function LiveNum({ value, decimals = 5, prefix = "$" }: { value: number; decimals?: number; prefix?: string }) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      setFlash(value > prev.current ? "up" : "down");
      prev.current = value;
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [value]);
  return (
    <span style={{
      color: flash === "up" ? "var(--green)" : flash === "down" ? "var(--red)" : "inherit",
      transition: "color 0.3s",
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {prefix}{value.toFixed(decimals)}
    </span>
  );
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.00001;
  const w = 56, h = 18;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", margin: "3px auto 0" }}>
      <polyline points={pts} fill="none"
        stroke={positive ? "var(--green)" : "var(--red)"}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LetterGrid({ items }: { items: TickerItem[] }) {
  const [, navigate] = useLocation();
  const letters = items.filter((i) => i.type === "letter");
  return (
    <div className="letter-grid-neo">
      {letters.map((item) => (
        <div
          key={item.symbol}
          className="letter-neo-card"
          onClick={() => navigate(`/appraisal/${item.symbol}`)}
        >
          <div className="letter-neo-sym">{item.symbol}</div>
          <div className="letter-neo-price">
            <LiveNum value={item.price_usd} decimals={5} />
          </div>
          <Sparkline data={item.sparkline ?? []} positive={item.change_pct >= 0} />
          <div className={`letter-neo-chg ${item.change_pct >= 0 ? "pos" : "neg"}`}>
            {item.change_pct >= 0 ? "▲" : "▼"} {Math.abs(item.change_pct).toFixed(2)}%
          </div>
          {item.corpus_count > 0 && (
            <div className="letter-neo-count">{item.corpus_count.toLocaleString()} in corpus</div>
          )}
        </div>
      ))}
    </div>
  );
}

function AppraisalBar({ letters }: { letters: CorpusSnapshot["letters"] }) {
  if (!letters.length) return null;
  const sorted = [...letters].sort((a, b) => b.demand_ratio - a.demand_ratio).slice(0, 10);
  const maxRatio = Math.max(...sorted.map((l) => l.demand_ratio));
  return (
    <div className="appraisal-bar-wrap">
      {sorted.map((l) => (
        <div key={l.letter} className="appraisal-bar-row">
          <span className="abar-letter">{l.letter}</span>
          <div className="abar-track">
            <div
              className="abar-fill"
              style={{ width: `${Math.min(100, (l.demand_ratio / Math.max(1, maxRatio)) * 100)}%` }}
            />
            <span className="abar-baseline" style={{ left: `${Math.min(100, (1 / Math.max(0.01, maxRatio)) * 100)}%` }} />
          </div>
          <span className={`abar-ratio ${l.demand_ratio > 1 ? "over" : "under"}`}>
            {l.demand_ratio.toFixed(2)}×
          </span>
          <span className="abar-price">${l.price_usd.toFixed(5)}</span>
        </div>
      ))}
      <div className="abar-legend">
        <span className="legend-dot over" /> Demand ratio vs English baseline &nbsp;
        <span style={{ color: "var(--muted-text)" }}>│</span>&nbsp; bar = {sorted[0]?.letter} demand&nbsp; | &nbsp;
        <span style={{ color: "var(--dim-text)" }}>vertical = parity (1×)</span>
      </div>
    </div>
  );
}

function SourceStatus({ sources }: { sources: CorpusSource[] }) {
  return (
    <div className="source-status-grid">
      {sources.map((s) => (
        <div key={s.name} className={`source-status-card ${s.status}`}>
          <div className="ss-dot" />
          <div className="ss-body">
            <div className="ss-name">{s.name}</div>
            <div className="ss-cat">{s.category}</div>
            {s.chars_extracted > 0 && (
              <div className="ss-chars">{s.chars_extracted.toLocaleString()} chars</div>
            )}
            {s.snippet && <div className="ss-snippet">"{s.snippet.slice(0, 80)}…"</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormulaDisplay() {
  return (
    <div className="formula-neo">
      <div className="formula-neo-title">PRICE DERIVATION FORMULA</div>
      <div className="formula-neo-eq">
        <span className="feq-var">P<sub>letter</sub></span>
        <span className="feq-op">=</span>
        <span className="feq-floor">P<sub>floor</sub></span>
        <span className="feq-op">+</span>
        <span className="feq-demand">ΔDemand(ƒ<sub>corpus</sub> / ƒ<sub>english</sub>)</span>
        <span className="feq-op">+</span>
        <span className="feq-rarity">Rarity<sub>premium</sub></span>
      </div>
      <div className="formula-neo-vars">
        <div className="fvar"><code>P_floor = $0.004</code> <span>minimum price floor</span></div>
        <div className="fvar"><code>ΔDemand = max(0, (demand_ratio − 0.6) × 0.018)</code> <span>over-indexed in crypto text</span></div>
        <div className="fvar"><code>Rarity = max(0, (1 − baseline/13) × 0.012)</code> <span>rare letter premium</span></div>
        <div className="fvar"><code>demand_ratio = corpus_freq% / english_baseline%</code> <span>live from corpus</span></div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const { items, corpusChars, updatedAt } = useTickerData();
  const corpus = useCorpusSnapshot();
  const [marketData, setMarketData] = useState<{
    market_cap_usd: number;
    daily_volume_usd: number;
    total_primitives: number;
    active_staked_sentences: number;
    corpus_sources_active: number;
    last_corpus_refresh: string;
  } | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/market/overview`)
      .then((r) => r.json())
      .then(setMarketData)
      .catch(() => {});
  }, []);

  const letters = items.filter((i) => i.type === "letter");
  const topGainer = [...letters].sort((a, b) => b.change_pct - a.change_pct)[0];
  const totalUsd = letters.reduce((s, l) => s + l.price_usd, 0);

  return (
    <div className="home-v2">

      {/* ── HERO ── */}
      <section className="hero-v2">
        <div className="hero-v2-bg">
          <div className="hero-grid-overlay" />
        </div>
        <div className="hero-v2-content">
          <div className="hero-v2-eyebrow">
            <span className="eyebrow-dot" />
            LANGUAGE.FI — LIVE APPRAISAL PROTOCOL
            <span className="eyebrow-sep" />
            {corpusChars > 0
              ? <span className="eyebrow-live">{corpusChars.toLocaleString()} CHARS APPRAISED</span>
              : <span className="eyebrow-live">CORPUS LOADING…</span>}
          </div>
          <h1 className="hero-v2-title">
            The market for<br />
            <span className="title-amber">meaning.</span>
          </h1>
          <p className="hero-v2-sub">
            A live laboratory that measures how language moves through public text.<br />
            Explore letter demand, price sentences, and inspect every source behind the model.
          </p>
          <div className="hero-v2-ctas">
            <button className="neo-btn-primary" onClick={() => navigate("/terminal")}>Explore the Market</button>
            <button className="neo-btn-ghost" onClick={() => navigate("/alchemist")}>Appraise a Sentence</button>
            <button className="neo-btn-ghost" onClick={() => navigate("/sources")}>View Sources</button>
          </div>
          {/* Live stats strip */}
          <div className="hero-stats-strip">
            {topGainer && (
              <div className="hstat">
                <span className="hstat-label">TOP MOVER</span>
                <span className="hstat-val">{topGainer.symbol} <span style={{ color: "var(--green)" }}>▲{topGainer.change_pct.toFixed(1)}%</span></span>
              </div>
            )}
            <div className="hstat">
              <span className="hstat-label">ALPHABET VALUE</span>
              <span className="hstat-val">${totalUsd.toFixed(4)}</span>
            </div>
            <div className="hstat">
              <span className="hstat-label">LIVE SOURCES</span>
              <span className="hstat-val">{corpus?.active_sources ?? "…"} / {corpus?.total_sources_queried ?? 5}</span>
            </div>
            <div className="hstat">
              <span className="hstat-label">CORPUS</span>
              <span className="hstat-val">{corpusChars > 0 ? `${(corpusChars / 1000).toFixed(0)}K chars` : "seeding…"}</span>
            </div>
            <div className="hstat">
              <span className="hstat-label">NETWORK</span>
              <span className="hstat-val" style={{ color: "var(--purple)" }}>◎ DEVNET</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE LETTER GRID ── */}
      <section className="section-v2">
        <div className="section-v2-header">
          <h2 className="section-v2-title">The alphabet, repriced</h2>
          <div className="section-v2-meta">
            <span className="live-pill">● LIVE</span>
            {updatedAt && <span style={{ color: "var(--dim-text)", fontSize: 11 }}> updated {new Date(updatedAt).toLocaleTimeString()}</span>}
          </div>
        </div>
        <p className="section-v2-sub">
          Experimental reference prices derived from observed character frequency across the connected public corpus. Values refresh as source data changes; they are not offers to buy or sell.
        </p>
        {items.length > 0
          ? <LetterGrid items={items} />
          : <div className="loading-neo">Fetching live corpus…</div>}
      </section>

      {/* ── APPRAISAL ENGINE ── */}
      <section className="section-v2">
        <div className="section-v2-header">
          <h2 className="section-v2-title">How appraisal works</h2>
          <span className="section-v2-badge">CORPUS-DERIVED</span>
        </div>
        <p className="section-v2-sub">
          Each reference price is calculated from observed letter frequency, compared with a standard English baseline, then adjusted by the published floor and rarity model. The formula and its inputs remain visible so the experiment can be inspected.
        </p>
        <FormulaDisplay />
        {corpus && (
          <div style={{ marginTop: "2rem" }}>
            <div className="section-v2-header" style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.9rem", fontFamily: "'IBM Plex Mono',monospace", color: "var(--primary)", letterSpacing: "0.08em" }}>
                DEMAND RATIO — TOP 10 OVER-INDEXED LETTERS
              </h3>
              <span style={{ fontSize: 11, color: "var(--dim-text)" }}>
                corpus: {corpus.total_chars.toLocaleString()} chars · refresh #{corpus.refresh_count}
              </span>
            </div>
            <AppraisalBar letters={corpus.letters} />
          </div>
        )}
      </section>

      {/* ── LIVE DATA SOURCES ── */}
      {corpus && corpus.sources.length > 0 && (
        <section className="section-v2">
          <div className="section-v2-header">
            <h2 className="section-v2-title">Source ledger</h2>
            <span className="section-v2-badge">{corpus.active_sources}/{corpus.total_sources_queried} ACTIVE</span>
          </div>
          <p className="section-v2-sub">
            Connected public sources are periodically sampled, normalized, and counted. This ledger shows which inputs responded, how much text they contributed, and when the model last refreshed.
          </p>
          <SourceStatus sources={corpus.sources} />
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <button className="neo-btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate("/sources")}>
              View all 30 declared sources →
            </button>
          </div>
        </section>
      )}

      {/* ── PROTOCOL STATS ── */}
      <section className="section-v2">
        <div className="section-v2-header">
          <h2 className="section-v2-title">Experiment telemetry</h2>
        </div>
        <div className="stats-neo-grid">
          {[
            { label: "Market Cap", value: marketData ? `$${(marketData.market_cap_usd / 1e6).toFixed(1)}M` : "—" },
            { label: "24h Volume", value: marketData ? `$${(marketData.daily_volume_usd / 1000).toFixed(0)}K` : "—" },
            { label: "Primitives", value: marketData?.total_primitives ?? 44 },
            { label: "Staked Sentences", value: marketData?.active_staked_sentences?.toLocaleString() ?? "—" },
            { label: "Live Sources", value: marketData ? `${marketData.corpus_sources_active}/5` : "—" },
            { label: "Corpus Chars", value: corpusChars > 0 ? `${(corpusChars / 1000).toFixed(0)}K` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="stat-neo-card">
              <div className="snc-value">{value}</div>
              <div className="snc-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLANA DEVNET ANCHORING ── */}
      <section className="section-v2 solana-section">
        <div className="section-v2-header">
          <h2 className="section-v2-title">Experimental devnet primitives</h2>
          <span className="section-v2-badge" style={{ background: "rgba(153,69,255,0.15)", color: "#9945FF", border: "1px solid rgba(153,69,255,0.3)" }}>◎ DEVNET</span>
        </div>
        <p className="section-v2-sub">
          Letter primitives are mapped to deterministic SPL token addresses on Solana devnet for testing. Devnet assets have no monetary value; displayed dollar figures are experimental appraisals, not market quotations.
        </p>
        <div className="solana-cards-grid">
          {["E", "T", "A", "S", "O", "I"].map((letter) => {
            const item = items.find((i) => i.symbol === letter);
            return (
              <div key={letter} className="solana-neo-card">
                <div className="sol-letter">{letter}</div>
                <div className="sol-price">
                  {item ? <LiveNum value={item.price_usd} decimals={5} /> : "—"}
                </div>
                <div className="sol-network">◎ DEVNET SPL</div>
                <button
                  className="sol-explore-btn"
                  onClick={() => navigate(`/primitives/${letter}`)}
                >
                  Explore →
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button className="neo-btn-ghost" onClick={() => navigate("/primitives")}>
            View all 44 primitives →
          </button>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <div className="manifesto-v2">
        <div className="manifesto-v2-inner">
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.14em", marginBottom: "1rem" }}>◈ MEMBRA PROTOCOL</div>
          <h2 className="manifesto-v2-quote">
            Language becomes measurable.<br />
            Meaning becomes inspectable.<br />
            <span style={{ color: "var(--primary)" }}>Every appraisal keeps its evidence close.</span>
          </h2>
          <p className="manifesto-v2-sub">Language.fi is an experimental appraisal surface: a transparent model, a living corpus, and a devnet laboratory for programmable language.</p>
          <div className="manifesto-v2-ctas">
            <button className="neo-btn-primary" onClick={() => navigate("/terminal")}>Explore the Market</button>
            <button className="neo-btn-ghost" onClick={() => navigate("/docs")}>Read the Method</button>
          </div>
        </div>
      </div>

    </div>
  );
}
