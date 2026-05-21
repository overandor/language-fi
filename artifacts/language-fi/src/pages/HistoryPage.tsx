import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import PriceHistoryChart from "@/components/PriceHistoryChart";

interface TickerItem {
  symbol: string;
  price_usd: number;
  change_pct: number;
  type: string;
}

const LETTERS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");

export default function HistoryPage() {
  const params = useParams<{ symbol?: string }>();
  const [, navigate] = useLocation();
  const [symbol, setSymbol] = useState((params.symbol ?? "E").toUpperCase());
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [kpi, setKpi] = useState<Record<string, unknown> | null>(null);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    fetch(`${base}/api/ticker`).then((r) => r.json()).then((d) => setTicker(d.items ?? [])).catch(() => {});
  }, [base]);

  useEffect(() => {
    fetch(`${base}/api/kpi/technical/${symbol}`).then((r) => r.json()).then(setKpi).catch(() => {});
  }, [symbol, base]);

  const current = ticker.find((t) => t.symbol === symbol);

  return (
    <div style={{ padding: "6rem 2rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.16em", marginBottom: "0.5rem" }}>◈ MEMBRA — PRICE HISTORY</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--soft-white)" }}>
            {symbol} / USD
          </span>
          {current && (
            <>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>
                ${current.price_usd.toFixed(5)}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: current.change_pct >= 0 ? "#34D399" : "#F87171" }}>
                {current.change_pct >= 0 ? "▲" : "▼"} {Math.abs(current.change_pct).toFixed(3)}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Letter selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "1.5rem" }}>
        {LETTERS.map((l) => {
          const t = ticker.find((t) => t.symbol === l);
          return (
            <button key={l} onClick={() => { setSymbol(l); navigate(`/history/${l}`); }} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "4px 8px",
              background: symbol === l ? "var(--primary)" : "var(--surface)",
              color: symbol === l ? "#000" : t ? (t.change_pct >= 0 ? "#34D399" : "#F87171") : "var(--muted-text)",
              border: `1px solid ${symbol === l ? "var(--primary)" : "var(--border)"}`,
              borderRadius: 5, cursor: "pointer", fontWeight: symbol === l ? 700 : 400,
              transition: "all 0.15s",
            }}>{l}</button>
          );
        })}
      </div>

      {/* Main chart */}
      <div style={{ marginBottom: "1.5rem" }}>
        <PriceHistoryChart symbol={symbol} height={300} showVolume showControls />
      </div>

      {/* Technical Indicators */}
      {kpi && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
            ◈ TECHNICAL INDICATORS — {symbol}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            {[
              { label: "RSI (14)", value: String(kpi.rsi), color: Number(kpi.rsi) > 70 ? "#F87171" : Number(kpi.rsi) < 30 ? "#34D399" : "var(--primary)" },
              { label: "EMA 12", value: `$${Number(kpi.ema_12).toFixed(6)}`, color: "var(--primary)" },
              { label: "EMA 26", value: `$${Number(kpi.ema_26).toFixed(6)}`, color: "var(--primary)" },
              { label: "MACD Signal", value: String(kpi.macd_signal), color: kpi.macd_signal === "BULLISH" ? "#34D399" : "#F87171" },
              { label: "Bollinger Upper", value: `$${Number(kpi.bollinger_upper).toFixed(6)}`, color: "var(--muted-text)" },
              { label: "Bollinger Lower", value: `$${Number(kpi.bollinger_lower).toFixed(6)}`, color: "var(--muted-text)" },
              { label: "B-Width", value: String(kpi.bollinger_width), color: "var(--primary)" },
              { label: "Snapshots", value: String(kpi.snapshots_available), color: "var(--dim-text)" },
            ].map((m) => (
              <div key={m.label} className="neo-stat">
                <div className="neo-stat-label">{m.label}</div>
                <div className="neo-stat-value" style={{ color: m.color, fontSize: 14 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All letters mini-charts */}
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
          ◈ ALL LETTER PRIMITIVES — PRICE HISTORY
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {LETTERS.map((l) => {
            const t = ticker.find((t) => t.symbol === l);
            return (
              <div key={l} onClick={() => { setSymbol(l); navigate(`/history/${l}`); }}
                style={{ background: "var(--surface)", border: `1px solid ${symbol === l ? "var(--primary)" : "var(--border)"}`, borderRadius: 8, padding: "10px", cursor: "pointer", transition: "border-color 0.2s" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 16, color: "var(--primary)" }}>{l}</span>
                  {t && (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: t.change_pct >= 0 ? "#34D399" : "#F87171" }}>
                      {t.change_pct >= 0 ? "+" : ""}{t.change_pct.toFixed(2)}%
                    </span>
                  )}
                </div>
                {t && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "var(--muted-text)", marginBottom: 6 }}>${t.price_usd.toFixed(5)}</div>}
                <PriceHistoryChart symbol={l} height={60} showVolume={false} showControls={false} compact />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
