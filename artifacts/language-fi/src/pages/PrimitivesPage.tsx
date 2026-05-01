import { useState, useEffect } from "react";
import { Link } from "wouter";

interface Primitive {
  symbol: string;
  type: string;
  price_lgu: number;
  weekly_change: number;
  usage_count: number;
  rank: number;
  oracle_confidence: number;
}

export default function PrimitivesPage() {
  const [primitives, setPrimitives] = useState<Primitive[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/primitives")
      .then((r) => r.json())
      .then((data) => {
        setPrimitives(data.primitives ?? []);
        setUpdatedAt(data.updated_at ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? primitives : primitives.filter((p) => p.type === filter);

  const updatedAgo = updatedAt ? (() => {
    const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  })() : null;

  return (
    <div className="primitives-page">
      <h1 className="section-title">Protocol Primitives</h1>
      <p className="section-subtitle">
        Every character — A–Z, 0–9, SPACE, and selected symbols — is a live API-served primitive with an oracle price. Click any row to explore its full oracle breakdown.
      </p>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div className="live-indicator">
          <span className="live-dot" /> Live Oracle Data
        </div>
        {updatedAgo && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", color: "var(--muted-text)" }}>
            Last snapshot: {updatedAgo}
          </span>
        )}
      </div>

      <div className="letter-explorer-filters" style={{ marginBottom: "2rem" }}>
        {[
          { key: "all", label: "All" },
          { key: "letter", label: "Letters (A–Z)" },
          { key: "number", label: "Numbers (0–9)" },
          { key: "separator", label: "Separators" },
          { key: "symbol", label: "Symbols" },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`filter-btn${filter === key ? " active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="primitives-table-wrap">
        <table className="registry-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Price (LGU)</th>
              <th>Weekly Change</th>
              <th>Usage Count</th>
              <th>Oracle Confidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="loading">Loading oracle data...</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.symbol} style={{ cursor: "pointer" }}>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted-text)", fontSize: "0.85rem" }}>#{p.rank}</td>
                <td>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontWeight: 700, fontSize: "1.05rem" }}>
                    {p.symbol === "SPACE" ? "SPACE" : p.symbol}
                  </span>
                </td>
                <td style={{ color: "var(--muted-text)", fontSize: "0.78rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>{p.type}</td>
                <td className="price-cell">{p.price_lgu.toFixed(3)}</td>
                <td className={p.weekly_change >= 0 ? "change-positive" : "change-negative"}>
                  {p.weekly_change >= 0 ? "+" : ""}{(p.weekly_change * 100).toFixed(1)}%
                </td>
                <td style={{ color: "var(--muted-text)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85rem" }}>
                  {p.usage_count.toLocaleString()}
                </td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85rem", color: p.oracle_confidence >= 0.95 ? "var(--neon-green)" : "var(--electric-blue)" }}>
                  {p.oracle_confidence ? `${Math.round(p.oracle_confidence * 100)}%` : "—"}
                </td>
                <td>
                  <Link
                    href={`/primitives/${encodeURIComponent(p.symbol)}`}
                    className="btn-link"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Explore →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "2rem", color: "var(--muted-text)", fontSize: "0.8rem", lineHeight: 1.8 }}>
        <strong style={{ color: "var(--soft-white)" }}>Oracle sources:</strong> Solana token names (25%) · NFT collections (20%) · Solana domains (15%) · Language.fi registry (25%) · Gate.io listings (15%)
      </div>
    </div>
  );
}
