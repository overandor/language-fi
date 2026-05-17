import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  sentence: string;
  formula_value_lgu: number;
  staked_since: string;
  stillness_days: number;
  owner: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sentence-leaderboard")
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="leaderboard-header">
      <h1 className="section-title">Sentence Leaderboard</h1>
      <p className="section-subtitle">
        Top-ranked staked sentences by formula value and stillness score. The higher the stillness, the greater the staking multiplier.
      </p>
      <div className="live-indicator">
        <span className="live-dot" />
        Live Rankings
      </div>
      <div className="leaderboard-table-wrap" style={{ marginTop: "2rem" }}>
        <div className="table-scroll">
          <table className="registry-table">
            <thead>
              <tr>
                <th className="sticky-col">#</th>
                <th>Sentence</th>
                <th>Value (LGU)</th>
                <th>Since</th>
                <th>Stillness</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="loading">Loading leaderboard...</td></tr>
              ) : entries.map((e) => (
                <tr key={e.rank}>
                  <td className="sticky-col">
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: e.rank <= 3 ? "var(--neon-green)" : "var(--muted-text)" }}>
                      #{e.rank}
                    </span>
                  </td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.sentence}</td>
                  <td className="price-cell">{e.formula_value_lgu.toFixed(3)}</td>
                  <td style={{ color: "var(--muted-text)", fontSize: "0.875rem", whiteSpace: "nowrap" }}>{e.staked_since}</td>
                  <td>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)" }}>
                      {e.stillness_days}d
                    </span>
                  </td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "var(--muted-text)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.owner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
