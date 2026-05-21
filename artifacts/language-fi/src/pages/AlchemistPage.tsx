import { useState, useEffect } from "react";

interface CharBreakdown {
  symbol: string;
  count: number;
  unit_price_usd: number;
  total_usd: number;
  pct: number;
}

interface CalcResult {
  sentence: string;
  characters: CharBreakdown[];
  base_usd: number;
  minting_fee_usd: number;
  total_usd: number;
  corpus_chars: number;
  updated_at: string;
}

const COLORS = ["#F59E0B","#FB923C","#FCD34D","#D97706","#FBBF24","#F97316","#EAB308","#CA8A04","#B45309","#92400E"];

function buildResult(sentence: string, breakdown: Array<{ char: string; price_usd: number }>, corpusChars: number, updatedAt: string): CalcResult {
  const charMap: Record<string, CharBreakdown> = {};
  for (const b of breakdown) {
    const key = b.char === " " ? "SPACE" : b.char;
    if (!charMap[key]) {
      charMap[key] = { symbol: key, count: 0, unit_price_usd: b.price_usd, total_usd: 0, pct: 0 };
    }
    charMap[key].count += 1;
    charMap[key].total_usd = Math.round((charMap[key].total_usd + b.price_usd) * 100000) / 100000;
  }
  const chars = Object.values(charMap);
  const base_usd = chars.reduce((s, c) => s + c.total_usd, 0);
  const minting_fee_usd = Math.round(base_usd * 0.05 * 100000) / 100000;
  const total_usd = Math.round((base_usd + minting_fee_usd) * 100000) / 100000;
  for (const c of chars) {
    c.pct = base_usd > 0 ? Math.round((c.total_usd / base_usd) * 1000) / 10 : 0;
  }
  return { sentence, characters: chars, base_usd, minting_fee_usd, total_usd, corpus_chars: corpusChars, updated_at: updatedAt };
}

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
      const r = await fetch(`${base}/api/sentences/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const d = await r.json();
      const res = buildResult(sentence, d.breakdown ?? [], d.corpus_chars ?? 0, d.updated_at ?? new Date().toISOString());
      setResult(res);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { calculate(input); }, []);

  useEffect(() => {
    if (!typed) return;
    const timer = setTimeout(() => calculate(input), 500);
    return () => clearTimeout(timer);
  }, [input, typed]);

  const sorted = result ? [...result.characters].sort((a, b) => b.total_usd - a.total_usd) : [];

  return (
    <div className="alchemist-page">
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.16em", marginBottom: "0.75rem" }}>
          ◈ MEMBRA — CORPUS-PRICED
        </div>
        <h1 className="section-title">SENTENCE ALCHEMIST</h1>
        <p className="section-subtitle">
          Real-time USD cost of any sentence — every character priced from live public text corpora. No oracles, no guesses.
        </p>
      </div>

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
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)" }}>
            {input.length}/200 chars · {new Set(input.replace(/ /g, "")).size} unique
            {result?.corpus_chars ? ` · corpus ${(result.corpus_chars / 1000).toFixed(0)}K chars` : ""}
          </span>
          <button className="btn-primary" style={{ padding: "6px 18px", fontSize: 12 }} onClick={() => calculate(input)} disabled={loading}>
            {loading ? "Computing…" : "Calculate"}
          </button>
        </div>
      </div>

      {/* Inline character badges while loading is fast */}
      {input && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "1.5rem" }}>
          {Array.from(input).map((ch, i) => {
            const key = ch === " " ? "SPACE" : ch;
            const item = result?.characters.find((c) => c.symbol === key);
            return (
              <span key={i} style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700,
                color: "var(--primary)", background: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: 6,
                padding: "2px 7px", display: "inline-flex", flexDirection: "column",
                alignItems: "center", minWidth: 28,
              }}>
                <span>{ch === " " ? "⎵" : ch}</span>
                {item && <span style={{ fontSize: 8, color: "var(--dim-text)", fontWeight: 400 }}>${item.unit_price_usd.toFixed(4)}</span>}
              </span>
            );
          })}
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
          <div>
            <div className="neo-card">
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", letterSpacing: "0.1em", marginBottom: "1rem" }}>▸ PER-CHARACTER BREAKDOWN (USD CORPUS PRICES)</div>
              <div className="table-scroll">
                <table className="registry-table">
                  <thead>
                    <tr>
                      <th>CHAR</th>
                      <th>COUNT</th>
                      <th>UNIT (USD)</th>
                      <th>TOTAL (USD)</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((c) => (
                      <tr key={c.symbol}>
                        <td className="letter-cell">{c.symbol === "SPACE" ? "⎵" : c.symbol}</td>
                        <td style={{ color: "var(--soft-white)", fontWeight: 600 }}>{c.count}</td>
                        <td className="price-cell">${c.unit_price_usd.toFixed(5)}</td>
                        <td style={{ color: "var(--primary)", fontWeight: 600 }}>${c.total_usd.toFixed(5)}</td>
                        <td style={{ color: "var(--muted-text)" }}>{c.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="cost-total-box" style={{ marginBottom: "1rem" }}>
              <div className="cost-total-label">SENTENCE COST</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "2rem", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>
                ${result.total_usd.toFixed(5)}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-text)", marginTop: 4 }}>
                USD · corpus-derived
              </div>
              <div className="cost-dist-bar" style={{ marginTop: "1rem" }}>
                {sorted.slice(0, 8).map((c, i) => (
                  <div key={c.symbol} style={{ flex: c.pct, background: COLORS[i % COLORS.length], height: "100%" }} title={`${c.symbol}: ${c.pct}%`} />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.75rem" }}>
                {sorted.slice(0, 8).map((c, i) => (
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
                { label: "BASE PRICE", val: result.base_usd },
                { label: "MINTING FEE (5%)", val: result.minting_fee_usd },
                { label: "TOTAL", val: result.total_usd },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: row.label === "TOTAL" ? "var(--primary)" : "var(--dim-text)", fontWeight: row.label === "TOTAL" ? 700 : 400 }}>{row.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>${row.val.toFixed(5)}</span>
                </div>
              ))}
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--dim-text)", marginTop: "0.5rem" }}>
                Updated: {new Date(result.updated_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
