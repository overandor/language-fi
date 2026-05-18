import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Appraisal {
  letter: string;
  price_usd: number;
  price_lgu: number;
  derivation: {
    corpus_total_chars: number;
    letter_count_in_corpus: number;
    corpus_freq_pct: number;
    english_baseline_pct: number;
    demand_ratio: number;
    demand_ratio_label: string;
    price_floor_usd: number;
    demand_premium_usd: number;
    rarity_premium_usd: number;
    formula: string;
  };
  sources: Array<{
    source: string;
    category: string;
    status: string;
    chars_total: number;
    last_fetched: string;
    snippet: string;
  }>;
  corpus_last_refresh: string;
  refresh_count: number;
}

interface HistoryData {
  current_price_usd: number;
  change_24h_pct: number;
  all_time_high_usd: number;
  all_time_low_usd: number;
  snapshots: Array<{ ts: number; price_usd: number }>;
}

function MiniChart({ snapshots }: { snapshots: Array<{ ts: number; price_usd: number }> }) {
  if (!snapshots.length) return null;
  const prices = snapshots.map((s) => s.price_usd);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.0001;
  const W = 320; const H = 80;
  const pts = snapshots.map((s, i) => {
    const x = (i / (snapshots.length - 1)) * W;
    const y = H - ((s.price_usd - min) / range) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  }).join(" ");
  const last = snapshots[snapshots.length - 1];
  const first = snapshots[0];
  const up = last.price_usd >= first.price_usd;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "var(--green)" : "var(--red)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AppraisalPage() {
  const params = useParams<{ letter: string }>();
  const letter = (params.letter ?? "E").toUpperCase();
  const [, navigate] = useLocation();
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/api/appraisal/${letter}`).then((r) => r.json()),
      fetch(`${BASE}/api/history/${letter}`).then((r) => r.json()),
    ]).then(([a, h]) => {
      setAppraisal(a);
      setHistory(h);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [letter]);

  const ALPHABET = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem" }}>
      {/* Letter nav */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "2.5rem" }}>
        {ALPHABET.map((l) => (
          <button
            key={l}
            onClick={() => navigate(`/appraisal/${l}`)}
            style={{
              width: 34, height: 34,
              background: l === letter ? "var(--primary)" : "var(--surface)",
              color: l === letter ? "#08080E" : "var(--muted-text)",
              border: `1px solid ${l === letter ? "var(--primary)" : "var(--border)"}`,
              borderRadius: 8, cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 13,
              transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", color: "var(--dim-text)", padding: "4rem", textAlign: "center" }}>
          Fetching appraisal…
        </div>
      )}

      {appraisal && (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
            <div style={{
              width: 100, height: 100, borderRadius: 20,
              background: "var(--surface)", border: "1px solid var(--border-bright)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--neo-shadow-dark), var(--glow-amber)",
              fontFamily: "'Space Grotesk',sans-serif", fontSize: "3.5rem",
              fontWeight: 800, color: "var(--primary)",
            }}>{letter}</div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.14em", marginBottom: 6 }}>
                CORPUS-DERIVED USD PRICE
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "2.8rem", fontWeight: 700, color: "var(--soft-white)", lineHeight: 1 }}>
                ${appraisal.price_usd.toFixed(5)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "var(--dim-text)", marginTop: 6 }}>
                {appraisal.price_lgu.toFixed(5)} LGU &nbsp;·&nbsp;
                <span style={{ color: appraisal.derivation.demand_ratio > 1 ? "var(--green)" : "var(--muted-text)" }}>
                  {appraisal.derivation.demand_ratio_label} ({appraisal.derivation.demand_ratio}×)
                </span>
              </div>
            </div>
            {history && (
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: history.change_24h_pct >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                  {history.change_24h_pct >= 0 ? "+" : ""}{history.change_24h_pct.toFixed(2)}% (24h)
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--dim-text)", marginTop: 4 }}>
                  ATH ${history.all_time_high_usd.toFixed(5)} &nbsp; ATL ${history.all_time_low_usd.toFixed(5)}
                </div>
              </div>
            )}
          </div>

          {/* Price chart */}
          {history && history.snapshots.length > 2 && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "1rem 1.2rem 0.6rem",
              marginBottom: "1.5rem", boxShadow: "var(--neo-shadow-raised)",
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: 8 }}>
                PRICE HISTORY — LAST 8H (5-MIN INTERVALS)
              </div>
              <MiniChart snapshots={history.snapshots} />
            </div>
          )}

          {/* Derivation breakdown */}
          <div style={{
            background: "var(--surface-deep)", border: "1px solid var(--border-bright)",
            borderRadius: 16, padding: "1.6rem 1.8rem", marginBottom: "1.5rem",
            boxShadow: "var(--neo-shadow-dark)",
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--primary)", letterSpacing: "0.14em", marginBottom: "1.2rem" }}>
              PRICE DERIVATION — {appraisal.derivation.formula.toUpperCase()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: "1.2rem" }}>
              {[
                { label: "Corpus chars", val: appraisal.derivation.corpus_total_chars.toLocaleString() },
                { label: `Letter '${letter}' count`, val: appraisal.derivation.letter_count_in_corpus.toLocaleString() },
                { label: "Corpus freq %", val: `${appraisal.derivation.corpus_freq_pct.toFixed(4)}%` },
                { label: "English baseline %", val: `${appraisal.derivation.english_baseline_pct}%` },
                { label: "Demand ratio", val: `${appraisal.derivation.demand_ratio}×`, highlight: appraisal.derivation.demand_ratio > 1 },
                { label: "Price floor", val: `$${appraisal.derivation.price_floor_usd}` },
                { label: "Demand premium", val: `+$${appraisal.derivation.demand_premium_usd.toFixed(5)}`, pos: true },
                { label: "Rarity premium", val: `+$${appraisal.derivation.rarity_premium_usd.toFixed(5)}`, pos: true },
              ].map(({ label, val, highlight, pos }) => (
                <div key={label} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "10px 12px",
                }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--dim-text)", letterSpacing: "0.08em", marginBottom: 4 }}>{label.toUpperCase()}</div>
                  <div style={{
                    fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 700,
                    color: highlight ? "var(--green)" : pos ? "var(--primary)" : "var(--soft-white)",
                  }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{
              borderTop: "1px solid var(--border)", paddingTop: "1rem",
              fontFamily: "'IBM Plex Mono',monospace", fontSize: 11,
              color: "var(--muted-text)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
            }}>
              <span style={{ color: "var(--dim-text)" }}>Last corpus refresh:</span>
              <span style={{ color: "var(--primary)" }}>{new Date(appraisal.corpus_last_refresh).toLocaleString()}</span>
              <span style={{ color: "var(--dim-text)" }}>·</span>
              <span>Refresh #{appraisal.refresh_count}</span>
            </div>
          </div>

          {/* Sources */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "1.4rem 1.6rem",
            boxShadow: "var(--neo-shadow-raised)",
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--primary)", letterSpacing: "0.14em", marginBottom: "1rem" }}>
              CORPUS SOURCES — '{letter}' APPEARANCES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {appraisal.sources.map((s) => (
                <div key={s.source} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  padding: "10px 12px", borderRadius: 10,
                  background: "var(--surface-deep)",
                  border: `1px solid ${s.status === "ok" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.1)"}`,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0,
                    background: s.status === "ok" ? "var(--green)" : "var(--red)",
                    boxShadow: s.status === "ok" ? "0 0 5px var(--green)" : "none",
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{s.source}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--dim-text)" }}>{s.category}</span>
                      {s.chars_total > 0 && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--primary)" }}>{s.chars_total.toLocaleString()} chars</span>}
                    </div>
                    {s.snippet && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "var(--dim-text)", fontStyle: "italic" }}>"{s.snippet.slice(0, 100)}…"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
