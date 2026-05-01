import { useState, useEffect } from "react";
import { useParams } from "wouter";

interface LetterDetail {
  letter: string;
  current_price: number;
  weekly_usage: number;
  prev_week_usage: number;
  weekly_change: number;
  rank: string;
  volatility: string;
  congestion_tax: string;
  long_interest: string;
  top_protocol: string;
}

interface ProtocolBreakdown {
  name: string;
  usage: number;
  change: number;
}

export default function LetterPage() {
  const params = useParams<{ letter: string }>();
  const letter = (params.letter ?? "A").toUpperCase();
  const [detail, setDetail] = useState<LetterDetail | null>(null);
  const [breakdown, setBreakdown] = useState<ProtocolBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/letter/${letter}`).then((r) => r.json()),
      fetch(`/api/protocol-breakdown/${letter}`).then((r) => r.json()),
    ]).then(([d, b]) => {
      setDetail(d);
      setBreakdown(b);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [letter]);

  if (loading) {
    return <div style={{ padding: "10rem 2rem", textAlign: "center", color: "var(--muted-text)" }}>Loading...</div>;
  }

  if (!detail) {
    return <div style={{ padding: "10rem 2rem", textAlign: "center", color: "var(--muted-text)" }}>Letter not found.</div>;
  }

  const maxUsage = Math.max(...breakdown.map((b) => b.usage));

  return (
    <div className="letter-detail">
      <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem", marginBottom: "2rem" }}>
        <div className="giant-letter">{letter}</div>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "2rem", fontWeight: 700, color: "var(--neon-green)" }}>
            {detail.current_price.toFixed(3)} LGU
          </div>
          <div style={{ color: "var(--muted-text)", fontSize: "0.875rem" }}>Current Oracle Price</div>
        </div>
      </div>

      <div className="letter-stats-grid">
        {[
          { label: "Rank", value: detail.rank },
          { label: "Weekly Usage", value: detail.weekly_usage.toLocaleString() },
          { label: "Weekly Change", value: `${detail.weekly_change >= 0 ? "+" : ""}${detail.weekly_change.toFixed(2)}%` },
          { label: "Volatility", value: detail.volatility },
          { label: "Congestion Tax", value: detail.congestion_tax },
          { label: "Long Interest", value: detail.long_interest },
          { label: "Top Protocol", value: detail.top_protocol },
          { label: "Prev. Week Usage", value: detail.prev_week_usage.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="letter-stat-card">
            <div className="letter-stat-label">{label}</div>
            <div className="letter-stat-value" style={{
              color: label === "Weekly Change"
                ? (parseFloat(value) >= 0 ? "var(--neon-green)" : "#f87171")
                : "var(--electric-blue)",
              fontSize: "1.1rem",
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginTop: "3rem", marginBottom: "1.5rem", color: "var(--soft-white)" }}>
        Protocol Usage Breakdown
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {breakdown.map((b) => (
          <div key={b.name} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1.5rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontWeight: 500 }}>{b.name}</span>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted-text)", fontSize: "0.875rem" }}>
                  {b.usage.toLocaleString()}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: b.change >= 0 ? "var(--neon-green)" : "#f87171", fontSize: "0.875rem" }}>
                  {b.change >= 0 ? "+" : ""}{b.change.toFixed(2)}%
                </span>
              </div>
            </div>
            <div style={{ background: "var(--elevated-surface)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(b.usage / maxUsage) * 100}%`,
                background: "linear-gradient(90deg, var(--electric-blue), var(--neon-green))",
                borderRadius: "4px",
                transition: "width 1s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
