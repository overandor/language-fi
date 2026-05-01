import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";

interface OracleSource {
  occurrences: number;
  weight: number;
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
  weighted_usage: number;
  oracle_sources: {
    solana_token_names: OracleSource;
    solana_nft_collections: OracleSource;
    solana_domains: OracleSource;
    languagefi_registry_entries: OracleSource;
    gateio_token_listings: OracleSource;
  };
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

const SOURCE_LABELS: Record<string, string> = {
  solana_token_names: "Solana Token Names",
  solana_nft_collections: "Solana NFT Collections",
  solana_domains: "Solana Domains",
  languagefi_registry_entries: "Language.fi Registry",
  gateio_token_listings: "Gate.io Token Listings",
};

export default function PrimitiveDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params.symbol ?? "A").toUpperCase();
  const [detail, setDetail] = useState<PrimitiveDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/primitives/${encodeURIComponent(symbol)}`)
      .then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setDetail(d);
      })
      .catch(() => setError("Primitive not found."))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return <div style={{ padding: "10rem 2rem", textAlign: "center", color: "var(--muted-text)" }}>Loading oracle data...</div>;
  }
  if (error || !detail) {
    return (
      <div style={{ padding: "10rem 2rem", textAlign: "center" }}>
        <div style={{ color: "#f87171", marginBottom: "1rem" }}>{error || "Primitive not found."}</div>
        <Link href="/primitives" className="btn-secondary">← Back to Primitives</Link>
      </div>
    );
  }

  const sources = detail.oracle_sources;
  const maxSource = Math.max(...Object.values(sources).map(s => s.occurrences));
  const m = detail.weekly_market;
  const pb = detail.price_breakdown;
  const updatedAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(detail.oracle_updated_at).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  })();

  return (
    <div className="letter-detail">
      {/* Hero */}
      <section className="letter-hero" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "2rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <div className="giant-letter">{symbol === "SPACE" ? "·" : symbol}</div>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", color: "var(--muted-text)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
              {detail.type} primitive
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "2.5rem", fontWeight: 700, color: "var(--neon-green)" }}>
              {detail.price_lgu.toFixed(3)} LGU
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.875rem", color: detail.weekly_change_percent >= 0 ? "var(--neon-green)" : "#f87171" }}>
                {detail.weekly_change_percent >= 0 ? "+" : ""}{detail.weekly_change_percent.toFixed(2)}% 7d
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.875rem", color: "var(--muted-text)" }}>
                Oracle: {Math.round(detail.oracle_confidence * 100)}% confidence
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.875rem", color: "var(--muted-text)" }}>
                Updated {updatedAgo}
              </span>
            </div>
          </div>
        </div>

        <div className="letter-stats-grid">
          {[
            { label: "Current Price", value: `${detail.price_lgu.toFixed(3)} LGU` },
            { label: "Previous Price", value: `${detail.previous_price_lgu.toFixed(3)} LGU` },
            { label: "Weekly Change", value: `${detail.weekly_change_percent >= 0 ? "+" : ""}${detail.weekly_change_percent.toFixed(2)}%` },
            { label: "Rank", value: `#${detail.rank}` },
            { label: "Volatility", value: detail.volatility.charAt(0).toUpperCase() + detail.volatility.slice(1) },
            { label: "Current Week Usage", value: detail.usage_count_current_week.toLocaleString() },
            { label: "Previous Week Usage", value: detail.usage_count_previous_week.toLocaleString() },
            { label: "Weighted Oracle Usage", value: detail.weighted_usage.toLocaleString() },
            { label: "Staked Sentence Exposure", value: `${detail.staked_sentence_exposure.toLocaleString()} sentences` },
            { label: "Oracle Confidence", value: `${Math.round(detail.oracle_confidence * 100)}%` },
            { label: "Most Active Protocol", value: m.protocol },
            { label: "Type", value: detail.type.charAt(0).toUpperCase() + detail.type.slice(1) },
          ].map(({ label, value }) => (
            <div key={label} className="letter-stat-card">
              <div className="letter-stat-label">{label}</div>
              <div className="letter-stat-value" style={{
                color: label === "Weekly Change"
                  ? (detail.weekly_change_percent >= 0 ? "var(--neon-green)" : "#f87171")
                  : "var(--electric-blue)",
                fontSize: "0.95rem",
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Oracle Source Breakdown */}
      <section style={{ marginTop: "2rem" }}>
        <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Oracle Source Breakdown</h2>
        <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>
          Where <strong style={{ color: "var(--electric-blue)" }}>{symbol}</strong> is counted — with source weights and contribution to the oracle price.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {(Object.entries(sources) as [string, OracleSource][]).map(([key, src]) => (
            <div key={key} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--soft-white)", marginBottom: "0.2rem" }}>{SOURCE_LABELS[key]}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted-text)", fontSize: "0.75rem" }}>
                    Weight: {Math.round(src.weight * 100)}%
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontWeight: 700 }}>
                    {src.occurrences.toLocaleString()}
                  </div>
                  <div style={{ color: "var(--muted-text)", fontSize: "0.75rem" }}>occurrences</div>
                </div>
              </div>
              <div style={{ background: "var(--elevated-surface)", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(src.occurrences / maxSource) * 100}%`,
                  background: "linear-gradient(90deg, var(--electric-blue), var(--neon-green))",
                  borderRadius: "4px",
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Oracle API Response (the spec's response example) */}
      <section style={{ marginTop: "2.5rem" }}>
        <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Live Oracle Snapshot</h2>
        <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>Raw oracle data for this primitive.</p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {[
              ["Symbol", symbol],
              ["Window", "Weekly"],
              ["Updated At", new Date(detail.oracle_updated_at).toLocaleString()],
              ["Current Usage", detail.usage_count_current_week.toLocaleString()],
              ["Previous Usage", detail.usage_count_previous_week.toLocaleString()],
              ["Weekly Change", `${detail.weekly_change_percent >= 0 ? "+" : ""}${detail.weekly_change_percent.toFixed(2)}%`],
              ["Market Direction", m.change_pct >= 0 ? "Up ↑" : "Down ↓"],
              ["Long Bias", `${m.long_pct}% / ${m.short_pct}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", marginBottom: "0.25rem" }}>{label}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontSize: "0.9rem" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gate.io Tokens */}
      {detail.gateio_tokens.length > 0 && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Gate.io Token Popularity</h2>
          <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>
            Top Gate.io-listed tokens containing <strong style={{ color: "var(--electric-blue)" }}>{symbol}</strong>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: "1rem", marginBottom: "1.25rem", width: "fit-content" }}>
            {[
              { label: `Tokens with ${symbol}`, value: detail.gateio_stats.tokens_containing.toLocaleString() },
              { label: "Total occurrences", value: detail.gateio_stats.total_occurrences.toLocaleString() },
              { label: "Share of listed", value: `${detail.gateio_stats.share_of_listed}%` },
              { label: "Rank", value: `#${detail.gateio_stats.rank_among_all}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem", minWidth: "140px" }}>
                <div style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontSize: "1.2rem", fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="primitives-table-wrap">
            <table className="registry-table">
              <thead>
                <tr><th>Symbol</th><th>Token Name</th><th>{symbol} Count</th><th>Action</th></tr>
              </thead>
              <tbody>
                {detail.gateio_tokens.map(tok => (
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
        </section>
      )}

      {/* Price Breakdown */}
      {pb && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Why {symbol} costs {pb.final_price.toFixed(3)} LGU</h2>
          <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>Full oracle price decomposition</p>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", maxWidth: "540px" }}>
            {[
              { label: "Base Price", value: pb.base_price, prefix: "" },
              { label: "Blockchain Usage Demand", value: pb.blockchain_usage, prefix: "+" },
              { label: "Token Name Demand", value: pb.token_name_usage, prefix: "+" },
              { label: "Regular Content Sample", value: pb.regular_content, prefix: "+" },
              { label: "Hash / Address Sample", value: pb.hash_address, prefix: "+" },
              { label: "Registry Demand", value: pb.registry_demand, prefix: "+" },
              { label: "Staking Demand", value: pb.staking_demand, prefix: "+" },
              { label: "Congestion Tax", value: pb.congestion_tax, prefix: "+" },
            ].map(({ label, value, prefix }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted-text)", fontSize: "0.9rem" }}>{label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: prefix === "+" ? "var(--neon-green)" : "var(--soft-white)", fontSize: "0.9rem" }}>
                  {prefix}{value.toFixed(3)} LGU
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0 0" }}>
              <span style={{ fontWeight: 700, color: "var(--soft-white)" }}>Final Price</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: "var(--electric-blue)", fontSize: "1.1rem" }}>
                {pb.final_price.toFixed(3)} LGU
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Settlement Proofs */}
      {detail.settlement_proofs.length > 0 && (
        <section style={{ marginTop: "2.5rem" }}>
          <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Settlement Proofs</h2>
          <p className="section-subtitle" style={{ marginBottom: "1.5rem" }}>Verified weekly market outcomes</p>
          <div className="primitives-table-wrap">
            <table className="registry-table">
              <thead>
                <tr><th>Market</th><th>Prev Window</th><th>Curr Window</th><th>Prev Usage</th><th>Curr Usage</th><th>Change</th><th>Winner</th><th>Status</th></tr>
              </thead>
              <tbody>
                {detail.settlement_proofs.map(p => (
                  <tr key={p.market}>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem" }}>{p.market}</td>
                    <td style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{p.prev_window}</td>
                    <td style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{p.curr_window}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.prev_usage.toLocaleString()}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{p.curr_usage.toLocaleString()}</td>
                    <td className={p.change_pct >= 0 ? "change-positive" : "change-negative"}>
                      {p.change_pct >= 0 ? "+" : ""}{p.change_pct.toFixed(2)}%
                    </td>
                    <td><span className={`status-badge ${p.winning_side === "Long" ? "active" : "inactive"}`}>{p.winning_side}</span></td>
                    <td style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div style={{ marginTop: "3rem", display: "flex", gap: "1rem" }}>
        <Link href="/primitives" className="btn-secondary">← Back to Primitives</Link>
      </div>
    </div>
  );
}
