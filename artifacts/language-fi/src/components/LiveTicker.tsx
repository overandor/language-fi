import { useState, useEffect, useRef } from "react";

interface TickerItem {
  symbol: string;
  price_usd: number;
  change_pct: number;
  type: string;
}

export default function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const r = await fetch(`${base}/api/ticker`);
        const d = await r.json();
        const incoming: TickerItem[] = (d.items ?? []).map((item: TickerItem) => ({
          ...item,
          change_pct: typeof item.change_pct === "number" ? item.change_pct : 0,
        }));
        prevPrices.current = Object.fromEntries(incoming.map((i) => [i.symbol, i.price_usd]));
        setItems(incoming);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchTicker();
    const id = setInterval(fetchTicker, 15000);
    return () => clearInterval(id);
  }, [base]);

  if (loading || items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="live-ticker-bar">
      <div className="ticker-label">
        <span className="ticker-dot" />
        LIVE
      </div>
      <div className="ticker-track-wrap">
        <div className="ticker-track">
          {doubled.map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-sym">{item.symbol}</span>
              <span className="ticker-price">${item.price_usd.toFixed(5)}</span>
              <span className={`ticker-chg ${item.change_pct >= 0 ? "pos" : "neg"}`}>
                {item.change_pct >= 0 ? "+" : ""}{item.change_pct.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
