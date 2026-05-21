import { useState, useEffect, useRef } from "react";

interface Snapshot {
  ts: number;
  price_usd: number;
  price_lgu: number;
  volume_24h: number;
}

interface HistoryData {
  symbol: string;
  current_price_usd: number;
  current_price_lgu: number;
  all_time_high_usd: number;
  all_time_low_usd: number;
  change_24h_pct: number;
  snapshots: Snapshot[];
  interval_minutes: number;
}

interface Props {
  symbol: string;
  height?: number;
  showVolume?: boolean;
  showControls?: boolean;
  compact?: boolean;
}

const RANGES = [
  { label: "1H", points: 12 },
  { label: "4H", points: 48 },
  { label: "8H", points: 96 },
  { label: "24H", points: 288 },
];

export default function PriceHistoryChart({ symbol, height = 220, showVolume = true, showControls = true, compact = false }: Props) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [range, setRange] = useState(2); // default 8H
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<{ x: number; y: number; snap: Snapshot } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    setLoading(true);
    fetch(`${base}/api/history/${symbol}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol, base]);

  if (loading) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-deep)", borderRadius: 10, color: "var(--dim-text)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
      Loading history…
    </div>
  );
  if (!data || data.snapshots.length < 2) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-deep)", borderRadius: 10, color: "var(--dim-text)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
      No history available
    </div>
  );

  const snaps = data.snapshots.slice(-RANGES[range].points);
  const prices = snaps.map((s) => s.price_usd);
  const volumes = snaps.map((s) => s.volume_24h);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const minV = Math.min(...volumes);
  const maxV = Math.max(...volumes);
  const priceRange = maxP - minP || maxP * 0.01;

  const W = 600;
  const chartH = showVolume ? height * 0.72 : height - 20;
  const volH = showVolume ? height * 0.20 : 0;
  const pad = { top: 12, right: 12, bottom: 8, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  const px = (i: number) => pad.left + (i / (snaps.length - 1)) * innerW;
  const py = (p: number) => pad.top + (1 - (p - minP) / priceRange) * innerH;

  const linePath = snaps.map((s, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(s.price_usd).toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L${px(snaps.length - 1).toFixed(1)},${(pad.top + innerH).toFixed(1)} L${pad.left},${(pad.top + innerH).toFixed(1)} Z`;

  const isUp = prices[prices.length - 1] >= prices[0];
  const lineColor = isUp ? "#34D399" : "#F87171";
  const gradId = `hist-${symbol}-${range}`;

  // Y-axis ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => minP + (priceRange * i) / tickCount);

  // Volume bars
  const volTop = chartH + 8;
  const volBars = snaps.map((s, i) => {
    const barH = maxV > minV ? ((s.volume_24h - minV) / (maxV - minV)) * volH : volH * 0.5;
    return { x: px(i) - innerW / snaps.length / 2, y: volTop + volH - barH, w: Math.max(1, innerW / snaps.length - 1), h: barH };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const relX = svgX - pad.left;
    const idx = Math.round((relX / innerW) * (snaps.length - 1));
    const clamped = Math.max(0, Math.min(snaps.length - 1, idx));
    const snap = snaps[clamped];
    setHovered({ x: px(clamped), y: py(snap.price_usd), snap });
  };

  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };
  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${fmtTime(ts)}`;
  };

  return (
    <div style={{ background: "var(--surface-deep)", borderRadius: 10, padding: compact ? "8px" : "14px", border: "1px solid var(--border)", boxShadow: "var(--neo-shadow-raised)" }}>
      {/* Header */}
      {!compact && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>
              ${data.current_price_usd.toFixed(5)}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: data.change_24h_pct >= 0 ? "#34D399" : "#F87171" }}>
              {data.change_24h_pct >= 0 ? "+" : ""}{data.change_24h_pct.toFixed(2)}% 24H
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--dim-text)" }}>
            <span>ATH <span style={{ color: "#34D399" }}>${data.all_time_high_usd.toFixed(5)}</span></span>
            <span>ATL <span style={{ color: "#F87171" }}>${data.all_time_low_usd.toFixed(5)}</span></span>
          </div>
        </div>
      )}

      {/* Range selector */}
      {showControls && (
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRange(i)} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "3px 9px",
              background: range === i ? "var(--primary)" : "var(--surface)",
              color: range === i ? "#000" : "var(--muted-text)",
              border: `1px solid ${range === i ? "var(--primary)" : "var(--border)"}`,
              borderRadius: 4, cursor: "pointer", fontWeight: range === i ? 700 : 400,
            }}>{r.label}</button>
          ))}
        </div>
      )}

      {/* SVG Chart */}
      <div style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${height}`}
          style={{ width: "100%", height, cursor: "crosshair", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line x1={pad.left} y1={py(tick)} x2={W - pad.right} y2={py(tick)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={pad.left - 4} y={py(tick) + 4} textAnchor="end" fill="rgba(148,163,184,0.7)" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                ${tick.toFixed(5)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Price line */}
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Volume bars */}
          {showVolume && volBars.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
              fill={snaps[i].price_usd >= (snaps[i - 1]?.price_usd ?? snaps[i].price_usd) ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)"}
            />
          ))}

          {/* Hover crosshair */}
          {hovered && (
            <>
              <line x1={hovered.x} y1={pad.top} x2={hovered.x} y2={chartH - pad.bottom} stroke="rgba(245,158,11,0.5)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={hovered.x} cy={hovered.y} r="4" fill={lineColor} stroke="var(--surface-deep)" strokeWidth="2" />
              {/* Tooltip */}
              <g transform={`translate(${Math.min(hovered.x + 8, W - 130)},${Math.max(pad.top + 4, hovered.y - 30)})`}>
                <rect x="0" y="0" width="122" height="38" fill="rgba(8,8,14,0.95)" stroke="rgba(245,158,11,0.4)" strokeWidth="1" rx="4" />
                <text x="6" y="13" fill="#F59E0B" fontSize="10" fontFamily="IBM Plex Mono, monospace" fontWeight="700">
                  ${hovered.snap.price_usd.toFixed(6)}
                </text>
                <text x="6" y="26" fill="rgba(148,163,184,0.8)" fontSize="9" fontFamily="IBM Plex Mono, monospace">
                  {fmtDate(hovered.snap.ts)}
                </text>
                <text x="6" y="37" fill="rgba(148,163,184,0.6)" fontSize="8" fontFamily="IBM Plex Mono, monospace">
                  Vol: {(hovered.snap.volume_24h / 1000).toFixed(0)}K
                </text>
              </g>
            </>
          )}

          {/* Time labels */}
          {[0, Math.floor(snaps.length / 4), Math.floor(snaps.length / 2), Math.floor(snaps.length * 3 / 4), snaps.length - 1].map((i) => (
            <text key={i} x={px(i)} y={height - 2} textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="8" fontFamily="IBM Plex Mono, monospace">
              {fmtTime(snaps[i].ts)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
