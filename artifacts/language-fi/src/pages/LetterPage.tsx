import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";

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

interface PrimitiveDetail {
  symbol: string;
  type: string;
  price_lgu: number;
  previous_price_lgu: number;
  weekly_change_percent: number;
  usage_count_current_week: number;
  usage_count_previous_week: number;
  rank: number;
  volatility: string;
  oracle_confidence: number;
  oracle_updated_at: string;
  gateio_tokens: Array<{ symbol: string; name: string; count: number }>;
  gateio_stats: { tokens_containing: number; total_occurrences: number; share_of_listed: number; rank_among_all: number };
  weekly_market: {
    protocol: string;
    last_week_usage: number;
    this_week_usage: number;
    change_pct: number;
    long_pool_lgu: number;
    short_pool_lgu: number;
    long_pct: number;
    short_pct: number;
    settlement_rule: string;
  };
  settlement_proofs: Array<{ market: string; prev_window: string; curr_window: string; prev_usage: number; curr_usage: number; change_pct: number; winning_side: string; status: string }>;
  price_breakdown: { base_price: number; blockchain_usage: number; token_name_usage: number; regular_content: number; hash_address: number; registry_demand: number; staking_demand: number; congestion_tax: number; final_price: number };
  staked_sentence_exposure: number;
}

export default function LetterPage() {
  const params = useParams<{ letter: string }>();
  const letter = (params.letter ?? "A").toUpperCase();
  const [detail, setDetail] = useState<LetterDetail | null>(null);
  const [breakdown, setBreakdown] = useState<ProtocolBreakdown[]>([]);
  const [primitive, setPrimitive] = useState<PrimitiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [positionDir, setPositionDir] = useState("Long (wins if usage increases)");
  const [stakeAmount, setStakeAmount] = useState(100);
  const [positionSubmitted, setPositionSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPositionSubmitted(false);
    Promise.all([
      fetch(`/api/letter/${letter}`).then((r) => r.json()),
      fetch(`/api/protocol-breakdown/${letter}`).then((r) => r.json()),
      fetch(`/api/primitives/${letter}`).then((r) => r.json()),
    ]).then(([d, b, p]) => {
      setDetail(d);
      setBreakdown(b);
      setPrimitive(p?.error ? null : p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [letter]);

  if (loading) {
    return <div style={{ padding: "10rem 2rem", textAlign: "center", color: "var(--muted-text)" }}>Loading oracle data...</div>;
  }
  if (!detail) {
    return <div style={{ padding: "10rem 2rem", textAlign: "center", color: "var(--muted-text)" }}>Letter not found.</div>;
  }

  const maxUsage = Math.max(...breakdown.map((b) => b.usage));
  const m = primitive?.weekly_market;
  const pb = primitive?.price_breakdown;

  return (
    <div className="letter-detail">
      {/* Hero stats */}
      <section className="letter-hero">
        <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
          <div className="giant-letter">{letter}</div>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "2.5rem", fontWeight: 700, color: "var(--neon-green)" }}>
              {detail.current_price.toFixed(3)} LGU
            </div>
            <div style={{ color: "var(--muted-text)", fontSize: "0.875rem", marginTop: "0.25rem" }}>Current Oracle Price</div>
            {primitive && (
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.875rem", color: primitive.weekly_change_percent >= 0 ? "var(--neon-green)" : "#f87171" }}>
                  {primitive.weekly_change_percent >= 0 ? "+" : ""}{primitive.weekly_change_percent.toFixed(2)}% 7d
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.875rem", color: "var(--muted-text)" }}>
                  Oracle confidence: {Math.round((primitive.oracle_confidence ?? 0.96) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="letter-stats-grid">
          {[
            { label: "Rank", value: detail.rank },
            { label: "Weekly Usage", value: detail.weekly_usage.toLocaleString() },
            { label: "Weekly Change", value: `${detail.weekly_change >= 0 ? "+" : ""}${detail.weekly_change.toFixed(2)}%` },
            { label: "Prev. Week Usage", value: detail.prev_week_usage.toLocaleString() },
            { label: "Long Interest", value: detail.long_interest },
            { label: "Top Protocol", value: detail.top_protocol },
            { label: "Volatility", value: detail.volatility },
            { label: "Congestion Tax", value: detail.congestion_tax },
            ...(primitive ? [
              { label: "Staked Exposure", value: primitive.staked_sentence_exposure.toLocaleString() + " sentences" },
            ] : []),
          ].map(({ label, value }) => (
            <div key={label} className="letter-stat-card">
              <div className="letter-stat-label">{label}</div>
              <div className="letter-stat-value" style={{
                color: label === "Weekly Change"
                  ? (parseFloat(value) >= 0 ? "var(--neon-green)" : "#f87171")
                  : label === "Congestion Tax"
                  ? (value === "Active" ? "#f87171" : "var(--neon-green)")
                  : "var(--electric-blue)",
                fontSize: "1rem",
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Protocol / Oracle Source Breakdown */}
      <section style={{ marginTop: "3rem" }}>
        <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          {letter} Usage by Oracle Source
        </h2>
        <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>
          Where {letter} is being counted across tracked ecosystems
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {breakdown.map((b) => (
            <div key={b.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{b.name}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: b.change >= 0 ? "var(--neon-green)" : "#f87171", fontSize: "0.8rem" }}>
                  {b.change >= 0 ? "+" : ""}{b.change.toFixed(2)}%
                </span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted-text)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                {b.usage.toLocaleString()} occurrences
              </div>
              <div style={{ background: "var(--elevated-surface)", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
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
      </section>

      {/* Gate.io Token Popularity */}
      {primitive && (
        <section style={{ marginTop: "3rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Gate.io Token Popularity: {letter}
          </h2>
          <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>
            Gate.io-listed tokens containing the letter {letter}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: `Tokens containing ${letter}`, value: primitive.gateio_stats.tokens_containing.toLocaleString() },
              { label: `Total ${letter} occurrences`, value: primitive.gateio_stats.total_occurrences.toLocaleString() },
              { label: "Share of listed tokens", value: `${primitive.gateio_stats.share_of_listed}%` },
              { label: "Rank among letters", value: `#${primitive.gateio_stats.rank_among_all}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontSize: "1.25rem", fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
          {primitive.gateio_tokens.length > 0 && (
            <div className="primitives-table-wrap">
              <table className="registry-table">
                <thead>
                  <tr>
                    <th>Symbol</th><th>Token Name</th><th>{letter} Count</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {primitive.gateio_tokens.map((tok) => (
                    <tr key={tok.symbol}>
                      <td className="letter-cell" style={{ fontSize: "1rem" }}>{tok.symbol}</td>
                      <td>{tok.name}</td>
                      <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)" }}>{tok.count}</td>
                      <td>
                        <a href={`https://www.gate.io/trade/${tok.symbol}_USDT`} target="_blank" rel="noopener noreferrer" className="btn-link">View</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Weekly Letter Market */}
      {m && (
        <section style={{ marginTop: "3rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Weekly Letter Market: {letter} / {m.protocol}
          </h2>
          <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>
            Long or short {letter} usage for the week. Settlement Sunday 23:59 UTC.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Last Week Usage", value: m.last_week_usage.toLocaleString(), color: "var(--muted-text)" as const },
              { label: "This Week Usage", value: m.this_week_usage.toLocaleString(), color: "var(--soft-white)" as const },
              { label: "Change", value: `${m.change_pct >= 0 ? "+" : ""}${m.change_pct.toFixed(2)}%`, color: (m.change_pct >= 0 ? "var(--neon-green)" : "#f87171") as string },
              { label: "Long Pool", value: `${m.long_pool_lgu.toLocaleString()} LGU`, color: "var(--neon-green)" as const },
              { label: "Short Pool", value: `${m.short_pool_lgu.toLocaleString()} LGU`, color: "#f87171" as const },
              { label: "Current Bias", value: `${m.long_pct}% Long`, color: "var(--electric-blue)" as const },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Position Form */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", maxWidth: "480px" }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "1rem", color: "var(--soft-white)" }}>Take a Position</h3>
            {positionSubmitted ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ color: "var(--neon-green)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                  ✓ Position Opened
                </div>
                <div style={{ color: "var(--muted-text)", fontSize: "0.85rem" }}>
                  {stakeAmount} LGU staked {positionDir.split(" ")[0]} on {letter} / {m.protocol}
                </div>
                <button className="btn-secondary" style={{ marginTop: "1rem" }} onClick={() => setPositionSubmitted(false)}>Open Another</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Market</label>
                  <div style={{ background: "var(--elevated-surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.6rem 1rem", color: "var(--soft-white)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.875rem" }}>
                    {letter} / {m.protocol} / Weekly
                  </div>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Direction</label>
                  <select
                    className="stake-input"
                    value={positionDir}
                    onChange={e => setPositionDir(e.target.value)}
                    style={{ width: "100%", fontSize: "0.875rem" }}
                  >
                    <option>Long (wins if usage increases)</option>
                    <option>Short (wins if usage decreases)</option>
                  </select>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>Stake Amount (LGU)</label>
                  <input
                    type="number"
                    className="stake-input"
                    value={stakeAmount}
                    min={10}
                    onChange={e => setStakeAmount(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ background: "var(--elevated-surface)", borderRadius: "6px", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--muted-text)" }}>Entry Snapshot: </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)" }}>{m.this_week_usage.toLocaleString()} uses</span>
                </div>
                <button className="btn-primary" style={{ width: "100%" }} onClick={() => setPositionSubmitted(true)}>
                  Open Position
                </button>
                <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--muted-text)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--soft-white)" }}>Settlement Rule:</strong> {m.settlement_rule}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Price Explanation */}
      {pb && (
        <section style={{ marginTop: "3rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Why {letter} costs {detail.current_price.toFixed(3)} LGU
          </h2>
          <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>Full price breakdown from the oracle</p>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", maxWidth: "540px" }}>
            {[
              { label: "Base Letter Price", value: pb.base_price, prefix: "" },
              { label: "Blockchain Usage Demand", value: pb.blockchain_usage, prefix: "+" },
              { label: "Token Name Demand", value: pb.token_name_usage, prefix: "+" },
              { label: "Regular Content Sample", value: pb.regular_content, prefix: "+" },
              { label: "Hash / Address Sample", value: pb.hash_address, prefix: "+" },
              { label: "Registry Demand", value: pb.registry_demand, prefix: "+" },
              { label: "Staking Demand", value: pb.staking_demand, prefix: "+" },
              { label: "Congestion Tax", value: pb.congestion_tax, prefix: "+" },
            ].map(({ label, value, prefix }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted-text)", fontSize: "0.9rem" }}>{label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: prefix === "+" ? "var(--neon-green)" : "var(--soft-white)", fontSize: "0.9rem" }}>
                  {prefix}{value.toFixed(3)} LGU
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0 0" }}>
              <span style={{ fontWeight: 700, color: "var(--soft-white)" }}>Final Price</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: "var(--electric-blue)", fontSize: "1.1rem" }}>
                {pb.final_price.toFixed(3)} LGU
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Charts — Placeholder (original was CSS-only) */}
      <section style={{ marginTop: "3rem" }}>
        <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Price &amp; Usage Charts</h2>
        <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>Historical data for letter {letter}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {[
            { title: "Price Over Time", sub: ["7d ago", "Now"] },
            { title: "Usage Over Time", sub: ["Week 1", "Week 2", "Week 3", "Week 4"] },
            { title: "Protocol Source Breakdown", sub: [] },
            { title: "Long vs Short Interest", sub: [] },
          ].map(({ title, sub }) => (
            <div key={title} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.25rem" }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.95rem", marginBottom: "1rem", color: "var(--soft-white)" }}>{title}</h3>
              <div style={{ height: "80px", background: "var(--elevated-surface)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {title === "Long vs Short Interest" && detail ? (
                  <div style={{ display: "flex", width: "100%", height: "100%", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: detail.long_interest, background: "var(--neon-green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#000", fontWeight: 700 }}>
                      {detail.long_interest} Long
                    </div>
                    <div style={{ flex: 1, background: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#fff", fontWeight: 700 }}>
                      Short
                    </div>
                  </div>
                ) : (
                  <span style={{ color: "var(--muted-text)", fontSize: "0.8rem", fontFamily: "'IBM Plex Mono', monospace" }}>Chart data available in v2</span>
                )}
              </div>
              {sub.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                  {sub.map(s => <span key={s} style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace" }}>{s}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Settlement Proofs */}
      {primitive?.settlement_proofs && primitive.settlement_proofs.length > 0 && (
        <section style={{ marginTop: "3rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Settlement Proofs</h2>
          <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>
            Verified outcomes for weekly {letter} positions
          </p>
          <div className="primitives-table-wrap">
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Market</th><th>Prev Window</th><th>Curr Window</th>
                  <th>Prev Usage</th><th>Curr Usage</th><th>Change</th>
                  <th>Winner</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {primitive.settlement_proofs.map((proof) => (
                  <tr key={proof.market}>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem" }}>{proof.market}</td>
                    <td style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{proof.prev_window}</td>
                    <td style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{proof.curr_window}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{proof.prev_usage.toLocaleString()}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{proof.curr_usage.toLocaleString()}</td>
                    <td className={proof.change_pct >= 0 ? "change-positive" : "change-negative"}>
                      {proof.change_pct >= 0 ? "+" : ""}{proof.change_pct.toFixed(2)}%
                    </td>
                    <td>
                      <span className={`status-badge ${proof.winning_side === "Long" ? "active" : "inactive"}`}>
                        {proof.winning_side}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{proof.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "1rem", color: "var(--muted-text)", fontSize: "0.8rem" }}>
            <strong style={{ color: "var(--soft-white)" }}>Oracle Sources:</strong> Solana token names, NFT collections, domains, registry entries, Gate.io token listings
          </div>
        </section>
      )}

      <div style={{ marginTop: "3rem" }}>
        <Link href="/" className="btn-secondary">← Back to Letter Explorer</Link>
      </div>
    </div>
  );
}
