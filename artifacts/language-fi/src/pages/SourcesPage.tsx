import { useState, useEffect } from "react";

interface DataSource {
  id: number;
  name: string;
  category: string;
  url: string;
  access: string;
  weight: number;
  description: string;
  latency_ms: number;
  freshness_s: number;
  status: "live" | "limited" | "offline";
}

const CATEGORY_COLORS: Record<string, string> = {
  Exchange: "#F59E0B",
  DEX: "#34D399",
  Blockchain: "#A78BFA",
  NFT: "#F87171",
  "News/Social": "#38BDF8",
  Social: "#38BDF8",
  Reference: "#FCD34D",
  "Dev/Social": "#6EE7B7",
  Aggregator: "#FB923C",
  Oracle: "#FBBF24",
  Indexer: "#C084FC",
  Research: "#E879F9",
};

export default function SourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    fetch(`${base}/api/sources`)
      .then((r) => r.json())
      .then((d) => { setSources(d.sources ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [base]);

  const categories = ["All", ...Array.from(new Set(sources.map((s) => s.category)))];
  const filtered = filter === "All" ? sources : sources.filter((s) => s.category === filter);

  function freshness(s: number) {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${s / 60}m`;
    return `${s / 3600}h`;
  }

  return (
    <div style={{ padding: "6rem 2rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.16em", marginBottom: "0.75rem" }}>◈ MEMBRA</div>
        <h1 className="section-title">DATA SOURCE ECOSYSTEM</h1>
        <p className="section-subtitle">
          30 public APIs and data sources power MEMBRA's letter appraisal oracle. Each source contributes weighted usage signals to primitive pricing.
        </p>
      </div>

      {/* Stats strip */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "TOTAL SOURCES", value: sources.length },
            { label: "LIVE", value: sources.filter((s) => s.status === "live").length, color: "var(--green)" },
            { label: "LIMITED ACCESS", value: sources.filter((s) => s.status === "limited").length, color: "var(--primary)" },
            { label: "CATEGORIES", value: categories.length - 1 },
          ].map((s) => (
            <div key={s.label} className="neo-stat">
              <div className="neo-stat-label">{s.label}</div>
              <div className="neo-stat-value" style={{ color: s.color ?? "var(--primary)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Category filters */}
      <div className="primitives-filter-bar" style={{ marginBottom: "1.5rem" }}>
        {categories.map((c) => (
          <button key={c} className={`filter-btn${filter === c ? " active" : ""}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {/* Sources grid */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--dim-text)", fontFamily: "'IBM Plex Mono', monospace", padding: "3rem" }}>Loading sources…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {filtered.map((src) => (
            <div key={src.id} className="neo-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 700, color: "var(--primary)" }}>{src.name}</span>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: "2px 7px",
                      borderRadius: 4, fontWeight: 700,
                      background: `${CATEGORY_COLORS[src.category] ?? "#F59E0B"}18`,
                      color: CATEGORY_COLORS[src.category] ?? "#F59E0B",
                      border: `1px solid ${CATEGORY_COLORS[src.category] ?? "#F59E0B"}30`,
                    }}>
                      {(src.category ?? "").toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-text)", lineHeight: 1.5 }}>{src.description}</p>
                </div>
                <span className={`status-badge ${src.status === "live" ? "active" : "pending"}`} style={{ flexShrink: 0, marginLeft: 8 }}>
                  {(src.status ?? "offline").toUpperCase()}
                </span>
              </div>

              <div style={{ background: "var(--surface-deep)", borderRadius: 8, padding: "8px 10px", boxShadow: "var(--neo-shadow-inset)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)", marginBottom: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {src.url}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
                <div style={{ background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 8px", boxShadow: "var(--neo-shadow-inset)" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--dim-text)" }}>WEIGHT</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>{src.weight.toFixed(2)}</div>
                </div>
                <div style={{ background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 8px", boxShadow: "var(--neo-shadow-inset)" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--dim-text)" }}>LATENCY</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--soft-white)", fontWeight: 600 }}>{src.latency_ms}ms</div>
                </div>
                <div style={{ background: "var(--surface-deep)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 8px", boxShadow: "var(--neo-shadow-inset)" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--dim-text)" }}>REFRESH</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--soft-white)", fontWeight: 600 }}>{freshness(src.freshness_s)}</div>
                </div>
              </div>

              {/* Weight bar */}
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ height: 4, background: "var(--surface-deep)", borderRadius: 2, overflow: "hidden", boxShadow: "var(--neo-shadow-inset)" }}>
                  <div style={{ height: "100%", background: CATEGORY_COLORS[src.category] ?? "var(--primary)", width: `${src.weight * 1000}%`, borderRadius: 2, transition: "width 0.6s" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
