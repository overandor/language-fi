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

interface LetterCounts {
  [letter: string]: number;
}

interface SourceSampleData {
  source: string;
  letterCounts: Record<string, number>;
  totalChars: number;
  sampledAt: string;
  rawData: string[];
  sampleSize: number;
  urls: string[];
  contentHash: string;
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
  const [letterCounts, setLetterCounts] = useState<LetterCounts>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "limited">("all");
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sourceSampleData, setSourceSampleData] = useState<SourceSampleData | null>(null);
  const [refreshingSource, setRefreshingSource] = useState(false);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetch("http://localhost:8080/api/sample-data", { method: "POST" });
      const [sourcesData, statsData] = await Promise.all([
        fetch("http://localhost:8080/api/sources").then(r => r.json()),
        fetch("http://localhost:8080/api/sample-stats").then(r => r.json()),
      ]);
      setSources(sourcesData.sources ?? []);
      setLetterCounts(statsData.aggregatedLetterCounts ?? {});
    } catch (err) {
      console.error("Failed to refresh data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const sampleSource = async (sourceId: number) => {
    setRefreshingSource(true);
    try {
      const response = await fetch(`http://localhost:8080/api/sample-source/${sourceId}`, { method: "POST" });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to sample source");
      }
      
      const data = await response.json();
      setSourceSampleData(data);
    } catch (err) {
      console.error("Failed to sample source:", err);
      setSourceSampleData(null);
      alert(`Sampling failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setRefreshingSource(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8080/api/sources").then(r => r.json()),
      fetch("http://localhost:8080/api/sample-stats").then(r => r.json()),
    ])
      .then(([sourcesData, statsData]) => {
        setSources(sourcesData.sources ?? []);
        setLetterCounts(statsData.aggregatedLetterCounts ?? {});
        setLoading(false);
      })
      .catch((err) => { console.error("Failed to fetch data:", err); setLoading(false); });
  }, []);

  // Auto-refresh selected source every minute
  useEffect(() => {
    if (selectedSource) {
      const interval = setInterval(() => {
        sampleSource(selectedSource.id);
      }, 60000); // 1 minute
      return () => clearInterval(interval);
    }
  }, [selectedSource]);

  const handleSourceClick = (source: DataSource) => {
    setSelectedSource(source);
    sampleSource(source.id);
  };

  const closeSourceDetail = () => {
    setSelectedSource(null);
    setSourceSampleData(null);
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter);
    // Navigate to letter page
    window.location.href = `/letter/${letter}`;
  };

  const handleStatusClick = (status: "live" | "limited") => {
    setStatusFilter(statusFilter === status ? "all" : status);
  };

  const categories = ["All", ...Array.from(new Set(sources.map((s) => s.category)))];
  const filtered = filter === "All" 
    ? sources 
    : sources.filter((s) => s.category === filter);
  const statusFiltered = statusFilter === "all" 
    ? filtered 
    : filtered.filter((s) => s.status === statusFilter);

  function freshness(s: number) {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${s / 60}m`;
    return `${s / 3600}h`;
  }

  return (
    <div style={{ padding: "6rem 2rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.16em", marginBottom: "0.75rem" }}>◈ MEMBRA</div>
          <h1 className="section-title">DATA SOURCE ECOSYSTEM</h1>
          <p className="section-subtitle">
            {sources.length} public APIs with real-time data streaming power MEMBRA's letter appraisal oracle. Each source contributes weighted usage signals to primitive pricing.
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          style={{
            padding: "0.75rem 1.5rem",
            background: "var(--primary)",
            border: "none",
            borderRadius: 8,
            color: "var(--bg)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.5 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => !refreshing && (e.currentTarget.style.background = "var(--primary-bright)")}
          onMouseLeave={(e) => e.currentTarget.style.background = "var(--primary)"}
        >
          {refreshing ? "REFRESHING..." : "REFRESH DATA"}
        </button>
      </div>

      {/* Stats strip */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "TOTAL SOURCES", value: sources.length, action: () => setFilter("All") },
            { label: "LIVE", value: sources.filter((s) => s.status === "live").length, color: "var(--green)", action: () => setFilter("All") },
            { label: "LIMITED ACCESS", value: sources.filter((s) => s.status === "limited").length, color: "var(--primary)", action: () => setFilter("All") },
            { label: "CATEGORIES", value: categories.length - 1, action: () => setFilter("All") },
          ].map((s) => (
            <div 
              key={s.label} 
              className="neo-stat"
              onClick={s.action}
              style={{ cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <div className="neo-stat-label">{s.label}</div>
              <div className="neo-stat-value" style={{ color: s.color ?? "var(--primary)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Letter distribution from sampled data */}
      {!loading && Object.keys(letterCounts).length > 0 && (
        <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "rgba(8, 8, 14, 0.6)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", color: "var(--primary)", marginBottom: "1rem" }}>
            Letter Distribution from Sampled Data (Click letter to view details)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "0.5rem" }}>
            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
              const count = letterCounts[letter] || 0;
              const maxCount = Math.max(...Object.values(letterCounts));
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div 
                  key={letter} 
                  onClick={() => handleLetterClick(letter)}
                  style={{ 
                    textAlign: "center",
                    cursor: "pointer",
                    padding: "0.5rem",
                    borderRadius: 8,
                    transition: "all 0.2s",
                    background: selectedLetter === letter ? "rgba(245, 158, 11, 0.2)" : "transparent",
                    border: selectedLetter === letter ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(245, 158, 11, 0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = selectedLetter === letter ? "rgba(245, 158, 11, 0.2)" : "transparent"}
                >
                  <div style={{ 
                    fontFamily: "'IBM Plex Mono', monospace", 
                    fontSize: "1.5rem", 
                    fontWeight: 700, 
                    color: "var(--primary)",
                    marginBottom: "0.25rem"
                  }}>
                    {letter}
                  </div>
                  <div style={{ 
                    fontFamily: "'IBM Plex Mono', monospace", 
                    fontSize: "0.75rem", 
                    color: "var(--muted-text)",
                    marginBottom: "0.25rem"
                  }}>
                    {count.toLocaleString()}
                  </div>
                  <div style={{ 
                    height: "4px", 
                    background: "var(--surface-deep)", 
                    borderRadius: 2, 
                    overflow: "hidden" 
                  }}>
                    <div style={{ 
                      height: "100%", 
                      background: "var(--primary)", 
                      width: `${percentage}%`,
                      borderRadius: 2 
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category filters */}
      <div className="primitives-filter-bar" style={{ marginBottom: "1.5rem" }}>
        {categories.map((c) => (
          <button 
            key={c} 
            className={`filter-btn${filter === c ? " active" : ""}`} 
            onClick={() => setFilter(c)}
            style={{ cursor: "pointer" }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Status filters */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => setStatusFilter("all")}
          style={{
            padding: "0.5rem 1rem",
            background: statusFilter === "all" ? "var(--primary)" : "var(--surface-deep)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: statusFilter === "all" ? "var(--bg)" : "var(--primary)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          ALL STATUS
        </button>
        <button
          onClick={() => handleStatusClick("live")}
          style={{
            padding: "0.5rem 1rem",
            background: statusFilter === "live" ? "var(--green)" : "var(--surface-deep)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: statusFilter === "live" ? "var(--bg)" : "var(--green)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          LIVE
        </button>
        <button
          onClick={() => handleStatusClick("limited")}
          style={{
            padding: "0.5rem 1rem",
            background: statusFilter === "limited" ? "var(--primary)" : "var(--surface-deep)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: statusFilter === "limited" ? "var(--bg)" : "var(--primary)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          LIMITED ACCESS
        </button>
      </div>

      {/* Sources grid */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--dim-text)", fontFamily: "'IBM Plex Mono', monospace", padding: "3rem" }}>Loading sources…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {statusFiltered.map((src) => (
            <div 
              key={src.id} 
              className="neo-card"
              onClick={() => handleSourceClick(src)}
              style={{ 
                cursor: "pointer",
                transition: "all 0.2s",
                border: selectedSource?.id === src.id ? "1px solid var(--primary)" : undefined,
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
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

              <div 
                style={{ 
                  background: "var(--surface-deep)", 
                  borderRadius: 8, 
                  padding: "8px 10px", 
                  boxShadow: "var(--neo-shadow-inset)", 
                  fontFamily: "'IBM Plex Mono', monospace", 
                  fontSize: 10, 
                  color: "var(--primary)", 
                  marginBottom: "0.75rem", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(src.url, '_blank');
                }}
              >
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

      {/* Source detail panel */}
      {selectedSource && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "450px",
          height: "100vh",
          background: "rgba(8, 8, 14, 0.98)",
          borderLeft: "1px solid var(--border)",
          padding: "2rem",
          overflowY: "auto",
          zIndex: 1000,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", color: "var(--primary)", margin: 0 }}>
              {selectedSource.name}
            </h2>
            <button
              onClick={closeSourceDetail}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--primary)",
                padding: "0.5rem 1rem",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.8rem",
              }}
            >
              CLOSE
            </button>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <button
              onClick={() => sampleSource(selectedSource.id)}
              disabled={refreshingSource}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: refreshingSource ? "var(--surface-deep)" : "var(--primary)",
                border: "none",
                borderRadius: 8,
                color: refreshingSource ? "var(--dim-text)" : "var(--bg)",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: refreshingSource ? "not-allowed" : "pointer",
                opacity: refreshingSource ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              {refreshingSource ? "REFRESHING..." : "REFRESH NOW"}
            </button>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "var(--dim-text)", marginTop: "0.5rem", textAlign: "center" }}>
              Auto-refreshes every 60 seconds
            </div>
          </div>

          {sourceSampleData && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
                  Sample Statistics
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
                  <div style={{ background: "var(--surface-deep)", padding: "0.75rem", borderRadius: 8 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "var(--dim-text)" }}>SAMPLE SIZE</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.1rem", color: "var(--primary)", fontWeight: 600 }}>
                      {sourceSampleData.sampleSize}
                    </div>
                  </div>
                  <div style={{ background: "var(--surface-deep)", padding: "0.75rem", borderRadius: 8 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "var(--dim-text)" }}>TOTAL CHARS</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.1rem", color: "var(--primary)", fontWeight: 600 }}>
                      {sourceSampleData.totalChars?.toLocaleString() || "0"}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "var(--dim-text)", marginTop: "0.5rem" }}>
                  Last sampled: {new Date(sourceSampleData.sampledAt).toLocaleTimeString()}
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
                  Letter Distribution
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.25rem" }}>
                  {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                    const count = sourceSampleData.letterCounts?.[letter] || 0;
                    const maxCount = sourceSampleData.letterCounts ? Math.max(...Object.values(sourceSampleData.letterCounts)) : 0;
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={letter} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>
                          {letter}
                        </div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "var(--dim-text)" }}>
                          {count}
                        </div>
                        <div style={{ height: "3px", background: "var(--surface-deep)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--primary)", width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
                  Raw Data Sample ({sourceSampleData.rawData?.length || 0} items)
                </h3>
                <div style={{ 
                  background: "var(--surface-deep)", 
                  borderRadius: 8, 
                  padding: "1rem", 
                  maxHeight: "300px", 
                  overflowY: "auto",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  color: "var(--primary)",
                }}>
                  {sourceSampleData.rawData.map((item, index) => (
                    <div key={index} style={{ padding: "0.25rem 0", borderBottom: "1px solid var(--border)" }}>
                      {index + 1}. {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
                  Data Sources ({sourceSampleData.urls.length} URLs)
                </h3>
                <div style={{ 
                  background: "var(--surface-deep)", 
                  borderRadius: 8, 
                  padding: "1rem", 
                  maxHeight: "150px", 
                  overflowY: "auto",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.7rem",
                  color: "var(--primary)",
                }}>
                  {sourceSampleData.urls.map((url, index) => (
                    <div key={index} style={{ padding: "0.25rem 0", borderBottom: "1px solid var(--border)" }}>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: "var(--primary)", textDecoration: "underline" }}
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", color: "var(--primary)", marginBottom: "0.75rem" }}>
                  Content Hash (SHA-256)
                </h3>
                <div style={{ 
                  background: "var(--surface-deep)", 
                  borderRadius: 8, 
                  padding: "1rem", 
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.7rem",
                  color: "var(--primary)",
                  wordBreak: "break-all",
                }}>
                  {sourceSampleData.contentHash}
                </div>
              </div>
            </>
          )}

          {!sourceSampleData && (
            <div style={{ textAlign: "center", color: "var(--dim-text)", fontFamily: "'IBM Plex Mono', monospace", padding: "2rem" }}>
              Click "Refresh Now" to fetch live data
            </div>
          )}
        </div>
      )}
    </div>
  );
}
