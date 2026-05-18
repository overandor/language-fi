import { useState, useEffect } from "react";

interface CharBreakdown {
  symbol: string;
  count: number;
  unit_price_lgu: number;
  unit_price_usd: number;
  total: number;
  total_usd: number;
  pct: number;
}

interface CalcResult {
  sentence: string;
  characters: CharBreakdown[];
  base_price: number;
  minting_fee: number;
  final_price: number;
  final_price_usd: number;
  oracle_updated_at: string;
}

const LGU_USD = 0.87;
const COLORS = ["#F59E0B","#FB923C","#FCD34D","#D97706","#FBBF24","#F97316","#EAB308","#CA8A04","#B45309","#92400E"];

export default function AlchemistPage() {
  const [input, setInput] = useState("LANGUAGE IS LIQUIDITY");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState(false);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const calculate = async (sentence: string) => {
    if (!sentence.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${base}/api/calculate-sentence-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const d = await r.json();
      const total = d.base_price ?? 0;
      const chars = (d.characters ?? []).map((c: { symbol: string; count: number; unit_price_lgu: number; total: number }) => ({
        ...c,
        unit_price_usd: Math.round(c.unit_price_lgu * LGU_USD * 10000) / 10000,
        total_usd: Math.round(c.total * LGU_USD * 10000) / 10000,
        pct: total > 0 ? Math.round((c.total / total) * 1000) / 10 : 0,
      }));
      setResult({ ...d, characters: chars, final_price_usd: Math.round(d.final_price * LGU_USD * 1000) / 1000 });
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    calculate(input);
  }, []);

  useEffect(() => {
    if (!typed) return;
    const timer = setTimeout(() => calculate(input), 600);
    return () => clearTimeout(timer);
  }, [input, typed]);

  return (
    <div className="alchemist-page">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.16em", marginBottom: "0.75rem" }}>
          ◈ MEMBRA
        </div>
        <h1 className="section-title">SENTENCE ALCHEMIST</h1>
        <p className="section-subtitle">
          Compute the LGU and USD cost of any sentence. Every character is a live oracle-priced primitive.
        </p>
      </div>

      {/* Input */}
      <div className="neo-card" style={{ marginBottom: "1.5rem" }}>
        <label className="stake-label">ENTER SENTENCE</label>
        <textarea
          className="alchemist-input"
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setTyped(true); }}
          placeholder="TYPE YOUR SENTENCE…"
          maxLength={200}
          rows={3}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)" }}>
            {input.length}/200 chars • {new Set(input.replace(/ /g,"")).size} unique
          </span>
          <button className="btn-primary" style={{ padding: "6px 18px", fontSize: 12 }} onClick={() => calculate(input)} disabled={loading}>
            {loading ? "Computing…" : "Calculate"}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
          {/* LEFT: Breakdown table */}
          <div>
            <div className="neo-card">
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "1rem" }}>▸ BREAKDOWN</div>
              <div className="table-scroll">
                <table className="registry-table">
                  <thead>
                    <tr>
                      <th>SYMBOL</th>
                      <th>COUNT</th>
                      <th>PRICE (LGU)</th>
                      <th>PRICE (USD)</th>
                      <th>TOTAL (LGU)</th>
                      <th>TOTAL (USD)</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.characters.sort((a, b) => b.total - a.total).map((c) => (
                      <tr key={c.symbol}>
                        <td className="letter-cell">{c.symbol === "SPACE" ? "⎵" : c.symbol}</td>
                        <td style={{ color: "var(--soft-white)", fontWeight: 600 }}>{c.count}</td>
                        <td className="price-cell">{c.unit_price_lgu.toFixed(4)}</td>
                        <td style={{ color: "var(--muted-text)" }}>${c.unit_price_usd.toFixed(4)}</td>
                        <td style={{ color: "var(--primary)", fontWeight: 600 }}>{c.total.toFixed(4)}</td>
                        <td style={{ color: "var(--muted-text)" }}>${c.total_usd.toFixed(4)}</td>
                        <td style={{ color: "var(--muted-text)" }}>{c.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Cost summary */}
          <div>
            <div className="cost-total-box" style={{ marginBottom: "1rem" }}>
              <div className="cost-total-label">TOTAL COST</div>
              <div className="cost-total-value">{result.final_price.toFixed(4)}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--muted-text)", marginTop: 4 }}>
                LGU
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 1.2 + "rem", color: "var(--accent-orange)", fontWeight: 700, marginTop: 6 }}>
                ≈ ${result.final_price_usd.toFixed(4)} USD
              </div>
              {/* Cost distribution bar */}
              <div className="cost-dist-bar" style={{ marginTop: "1rem" }}>
                {result.characters.sort((a, b) => b.total - a.total).slice(0, 8).map((c, i) => (
                  <div key={c.symbol} style={{ flex: c.pct, background: COLORS[i % COLORS.length], height: "100%" }} title={`${c.symbol}: ${c.pct}%`} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.75rem" }}>
                {result.characters.sort((a, b) => b.total - a.total).slice(0, 8).map((c, i) => (
                  <span key={c.symbol} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, display: "flex", alignItems: "center", gap: 4, color: "var(--muted-text)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], display: "inline-block" }} />
                    {c.symbol} {c.pct}%
                  </span>
                ))}
              </div>
            </div>

            <div className="neo-card">
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>▸ COST BREAKDOWN</div>
              {[
                { label: "BASE PRICE", lgu: result.base_price, usd: Math.round(result.base_price * LGU_USD * 10000) / 10000 },
                { label: "MINTING FEE (5%)", lgu: result.minting_fee, usd: Math.round(result.minting_fee * LGU_USD * 10000) / 10000 },
                { label: "TOTAL", lgu: result.final_price, usd: result.final_price_usd },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)" }}>{r.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>{r.lgu.toFixed(4)} LGU</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-text)" }}>${r.usd.toFixed(4)}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--dim-text)", marginTop: "0.5rem" }}>
                Updated: {new Date(result.oracle_updated_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
