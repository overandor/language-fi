import { useState, useEffect } from "react";

interface Primitive {
  symbol: string;
  type: string;
  price_lgu: number;
  weekly_change: number;
  usage_count: number;
  rank: number;
}

export default function PrimitivesPage() {
  const [primitives, setPrimitives] = useState<Primitive[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/primitives")
      .then((r) => r.json())
      .then((data) => { setPrimitives(data.primitives ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? primitives : primitives.filter((p) => p.type === filter);

  return (
    <div className="primitives-page">
      <h1 className="section-title">Protocol Primitives</h1>
      <p className="section-subtitle">
        The complete set of language primitives: letters, numbers, separators, and symbols — each with a live oracle price derived from cross-chain usage analysis.
      </p>

      <div className="live-indicator">
        <span className="live-dot" /> Live Oracle Data
      </div>

      <div className="letter-explorer-filters" style={{ marginBottom: "2rem" }}>
        {[
          { key: "all", label: "All" },
          { key: "letter", label: "Letters" },
          { key: "number", label: "Numbers" },
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
              <th>Symbol</th>
              <th>Type</th>
              <th>Price (LGU)</th>
              <th>Weekly Change</th>
              <th>Usage Count</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="loading">Loading oracle data...</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.symbol}>
                <td className="letter-cell">{p.symbol}</td>
                <td style={{ color: "var(--muted-text)", fontSize: "0.8rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase" }}>{p.type}</td>
                <td className="price-cell">{p.price_lgu}</td>
                <td className={p.weekly_change >= 0 ? "change-positive" : "change-negative"}>
                  {p.weekly_change >= 0 ? "+" : ""}{(p.weekly_change * 100).toFixed(1)}%
                </td>
                <td style={{ color: "var(--muted-text)" }}>{p.usage_count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
