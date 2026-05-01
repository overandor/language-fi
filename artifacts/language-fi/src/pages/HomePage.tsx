import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";

function parseUsage(s: string): number {
  const trimmed = s.trim();
  if (trimmed.endsWith("M")) return parseFloat(trimmed) * 1_000_000;
  if (trimmed.endsWith("K")) return parseFloat(trimmed) * 1_000;
  return parseFloat(trimmed) || 0;
}

interface LetterData {
  letter: string;
  price: number;
  change_24h: number;
  weekly_usage: string;
  rank: string;
  long_pct: string;
  short_pct: string;
  top_protocol: string;
  trend: string;
  volatility: string;
}

function CalculatorSection() {
  const [input, setInput] = useState("TOKEN");
  const [breakdown, setBreakdown] = useState<{ symbol: string; price: number }[]>([]);
  const [total, setTotal] = useState(0);

  const basePrices: Record<string, number> = {
    T: 0.185, O: 0.085, K: 0.045, E: 0.142, N: 0.072,
    A: 0.142, I: 0.095, R: 0.068, S: 0.105, H: 0.062, L: 0.058,
  };

  useEffect(() => {
    const upper = input.toUpperCase();
    let t = 0;
    const chars = Array.from(upper).map((c) => {
      const p = basePrices[c] ?? 0.03;
      t += p;
      return { symbol: c, price: p };
    });
    setBreakdown(chars);
    setTotal(t);
  }, [input]);

  return (
    <section className="calculator" id="words">
      <h2 className="section-title">Formula value engine.</h2>
      <div className="calculator-container">
        <input
          type="text"
          className="calculator-input"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 20))}
          placeholder="TYPE A WORD..."
        />
        <div className="letter-breakdown">
          {breakdown.map((c, i) => (
            <div key={i} className="letter-price">
              <div className="letter">{c.symbol}</div>
              <div className="price">${c.price.toFixed(3)}</div>
            </div>
          ))}
        </div>
        <div className="base-value">
          <div className="base-value-label">Formula Value</div>
          <div className="base-value-amount">${total.toFixed(3)} LGU</div>
        </div>
        <div className="base-value" style={{ marginTop: "1rem" }}>
          <div className="base-value-label">Popularity Tax (~12%)</div>
          <div className="base-value-amount">${(total * 0.12).toFixed(3)} LGU</div>
        </div>
        <div className="base-value" style={{ marginTop: "1rem", borderColor: "var(--neon-green)" }}>
          <div className="base-value-label">Estimated Mint Cost</div>
          <div className="base-value-amount" style={{ color: "var(--neon-green)" }}>
            ${(total * 1.12).toFixed(3)} LGU
          </div>
        </div>
        <p className="calculator-note">
          Formula value is not market value. Market price may differ based on demand, rarity, meaning, and ownership history.
        </p>
      </div>
    </section>
  );
}

function LetterTableSection({ letters, loading }: { letters: LetterData[]; loading: boolean }) {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState("all");

  const filtered = (() => {
    if (filter === "top-volume") return [...letters].sort((a, b) => parseUsage(b.weekly_usage) - parseUsage(a.weekly_usage));
    if (filter === "highest-price") return [...letters].sort((a, b) => b.price - a.price);
    if (filter === "volatile") return letters.filter((l) => l.volatility === "High");
    if (filter === "long-bias") return letters.filter((l) => parseInt(l.long_pct) > 60);
    if (filter === "short-bias") return letters.filter((l) => parseInt(l.short_pct) > 50);
    return letters;
  })();

  return (
    <section className="alphabet-market" id="letters">
      <h2 className="section-title">Letter Explorer.</h2>
      <p className="section-subtitle">
        A Bloomberg terminal for the alphabet. Live prices, usage, protocol breakdown, and market positions across all tracked ecosystems.
      </p>
      <div className="live-indicator">
        <span className="live-dot" />
        Live Data
      </div>
      <div className="table-scroll">
        <table className="registry-table letter-explorer-table">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Price (LGU)</th>
              <th>24h %</th>
              <th>Weekly Usage</th>
              <th>Rank</th>
              <th>Long %</th>
              <th>Short %</th>
              <th>Top Protocol</th>
              <th>Trend</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="loading">Loading live data...</td></tr>
            ) : filtered.map((l) => (
              <tr key={l.letter}>
                <td className="letter-cell">{l.letter}</td>
                <td className="price-cell">{l.price}</td>
                <td className={l.change_24h >= 0 ? "change-positive" : "change-negative"}>
                  {l.change_24h >= 0 ? "+" : ""}{l.change_24h}%
                </td>
                <td>{l.weekly_usage}</td>
                <td>{l.rank}</td>
                <td>{l.long_pct}</td>
                <td>{l.short_pct}</td>
                <td>{l.top_protocol}</td>
                <td className={l.change_24h >= 0 ? "trend-up" : "trend-down"}>{l.trend}</td>
                <td>
                  <button className="btn-link" onClick={() => navigate(`/letter/${l.letter}`)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="letter-explorer-filters">
        {[
          { key: "all", label: "All Letters" },
          { key: "top-volume", label: "Top Volume" },
          { key: "highest-price", label: "Highest Price" },
          { key: "volatile", label: "Most Volatile" },
          { key: "long-bias", label: "Long Bias" },
          { key: "short-bias", label: "Short Bias" },
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
    </section>
  );
}

function RegistryTableSection({ letters, loading }: { letters: LetterData[]; loading: boolean }) {
  const totalMarketCap = letters.reduce((sum, l) => sum + parseUsage(l.weekly_usage) * l.price * 52, 0);
  const dailyVolume = letters.reduce((sum, l) => sum + parseUsage(l.weekly_usage) * l.price, 0);
  const weeklyUsage = letters.reduce((sum, l) => sum + parseUsage(l.weekly_usage), 0);

  return (
    <section className="registry" id="sentences">
      <h2 className="section-title">Letter Registry.</h2>
      <p className="section-subtitle">
        Complete registry of all 26 letters with live prices, usage metrics, protocol breakdown, and market data.
      </p>
      <div className="live-indicator">
        <span className="live-dot" />
        Live Registry Data
      </div>
      <div className="table-scroll">
        <table className="registry-table letter-registry-table">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Price</th>
              <th>24h %</th>
              <th>Weekly Usage</th>
              <th>Total Volume</th>
              <th>Market Cap</th>
              <th>Rank</th>
              <th>Long %</th>
              <th>Short %</th>
              <th>Top Protocol</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} className="loading">Loading registry data...</td></tr>
            ) : letters.map((l) => {
              const n = parseUsage(l.weekly_usage);
              return (
                <tr key={l.letter}>
                  <td className="letter-cell">{l.letter}</td>
                  <td className="price-cell">{l.price}</td>
                  <td className={l.change_24h >= 0 ? "change-positive" : "change-negative"}>
                    {l.change_24h >= 0 ? "+" : ""}{l.change_24h}%
                  </td>
                  <td>{l.weekly_usage}</td>
                  <td>${(n * l.price * 7).toFixed(2)}</td>
                  <td>${(n * l.price * 52).toFixed(2)}</td>
                  <td>{l.rank}</td>
                  <td>{l.long_pct}</td>
                  <td>{l.short_pct}</td>
                  <td>{l.top_protocol}</td>
                  <td className={l.change_24h >= 0 ? "trend-up" : "trend-down"}>{l.trend}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="registry-stats">
        <div className="registry-stat-card">
          <div className="registry-stat-label">Total Market Cap</div>
          <div className="registry-stat-value">${totalMarketCap.toFixed(1)}M</div>
        </div>
        <div className="registry-stat-card">
          <div className="registry-stat-label">24h Volume</div>
          <div className="registry-stat-value">${dailyVolume.toFixed(0)}K</div>
        </div>
        <div className="registry-stat-card">
          <div className="registry-stat-label">Weekly Usage</div>
          <div className="registry-stat-value">{weeklyUsage.toFixed(1)}M</div>
        </div>
        <div className="registry-stat-card">
          <div className="registry-stat-label">Active Positions</div>
          <div className="registry-stat-value">{(letters.reduce((s, l) => s + parseInt(l.long_pct) * 10, 0)).toLocaleString()}</div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [, navigate] = useLocation();
  const [letters, setLetters] = useState<LetterData[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  const fetchLetters = useCallback(async () => {
    try {
      const res = await fetch("/api/letters");
      const data = await res.json();
      setLetters(data);
    } catch {
      // use empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLetters();
    const interval = setInterval(fetchLetters, 30000);
    return () => clearInterval(interval);
  }, [fetchLetters]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="hero" ref={heroRef}>
        <div className="hero-visual">
          <div className="floating-letter">A $0.18</div>
          <div className="floating-letter">E $0.20</div>
          <div className="floating-letter">T $0.30</div>
          <div className="floating-letter">Slot #1042</div>
          <div className="floating-letter">Hash 0x91a...f20</div>
          <div className="floating-letter">Formula Value $0.63</div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Language is liquidity.</h1>
          <p className="hero-subtitle">
            Language.fi transforms letters, words, names, and sentences into programmable financial assets through dynamic character pricing, prepaid minting slots, and a public linguistic registry.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={() => navigate("/explorer")}>Launch Explorer</button>
            <button className="btn-secondary" onClick={() => scrollTo("protocol")}>Read Protocol</button>
          </div>
        </div>
      </section>

      <section className="what-is" id="protocol">
        <h2 className="section-title">A market layer for language itself.</h2>
        <p>
          Language.fi prices letters as volatile protocol primitives. Words inherit value from their characters. Sentences are minted into registered transferable assets with hash, owner, slot, mint cost, and transfer history.
        </p>
        <div className="core-cards">
          {[
            { icon: "A", title: "Letters", desc: "Dynamic priced primitives with demand, volatility, usage, and tax state.", chips: ["Volatile", "Priced"] },
            { icon: "W", title: "Words", desc: "Composable value objects formed from priced character inputs.", chips: ["Inherited", "Formula"] },
            { icon: "S", title: "Sentences", desc: "Unique registered assets with formula value, mint cost, and market value.", chips: ["Transferable", "Registry"] },
          ].map(({ icon, title, desc, chips }) => (
            <div key={title} className="core-card">
              <div className="core-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
              {chips.map((c) => <span key={c} className="data-chip">{c}</span>)}
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">From character to capital.</h2>
        <div className="steps-container">
          {[
            { n: "01", title: "Observe Usage", desc: "The oracle samples registry activity, token names, blockchain hashes, and permitted real-world language data." },
            { n: "02", title: "Price Letters", desc: "Each letter receives a live protocol price based on usage, demand, volatility, and congestion." },
            { n: "03", title: "Buy Slot", desc: "Users purchase prepaid sentence capacity before finalizing the linguistic asset." },
            { n: "04", title: "Mint Sentence", desc: "A sentence consumes, locks, or burns the value of its component letters." },
            { n: "05", title: "Register Ownership", desc: "The registry records sentence hash, owner wallet, issuer signature, slot ID, letter cost, and transfer status." },
            { n: "06", title: "Trade Asset", desc: "The sentence becomes a transferable registered asset with protocol value and market value." },
          ].map(({ n, title, desc }) => (
            <div key={n} className="step-card">
              <div className="step-number">{n}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="primitives" id="primitives">
        <h2 className="section-title">Core asset types.</h2>
        <div className="primitives-grid">
          {[
            { icon: "A", title: "Letters", desc: "Dynamic priced primitives with demand, volatility, usage, and tax state." },
            { icon: "W", title: "Words", desc: "Composable value objects formed from priced character inputs." },
            { icon: "S", title: "Sentences", desc: "Unique registered assets with formula value, mint cost, and market value." },
            { icon: "◼", title: "Slots", desc: "Prepaid capacity that can later be filled with a sentence, creating a market for future linguistic minting rights." },
            { icon: "◈", title: "Registry", desc: "Public ownership and transfer layer for all registered linguistic assets." },
            { icon: "◉", title: "Oracle", desc: "Dynamic alphabet pricing engine that determines letter values from multiple source categories." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="primitive-card">
              <div className="primitive-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="why-it-matters">
        <h2 className="section-title">Why it matters.</h2>
        <ul className="why-list">
          <li>→ Language becomes financial infrastructure.</li>
          <li>→ Names gain protocol-calculated base value.</li>
          <li>→ Sentences get measurable creation cost.</li>
          <li>→ Cultural trends and memes affect linguistic markets.</li>
          <li>→ Uniqueness and capped supply can coexist in one monetary system.</li>
        </ul>
      </section>

      <LetterTableSection letters={letters} loading={loading} />

      <section className="tokenization" id="words">
        <h2 className="section-title">Tokenization primitives.</h2>
        <p className="section-subtitle">The asset stack: letters form words, words form names, sentences become registered assets.</p>
        <div className="tokenization-stack">
          {[
            { label: "Letters", desc: "Priced protocol inputs with oracle-driven value" },
            { label: "Words", desc: "Formula value from character composition" },
            { label: "Names", desc: "Project and identity assets with cultural demand" },
            { label: "Sentences", desc: "Unique registered assets with hash and ownership" },
            { label: "Registry", desc: "Public ownership and transfer layer" },
          ].map(({ label, desc }, i, arr) => (
            <div key={label} style={{ width: "100%" }}>
              <div className="stack-layer">
                <div className="layer-label">{label}</div>
                <div className="layer-description">{desc}</div>
              </div>
              {i < arr.length - 1 && <div className="stack-arrow">↓</div>}
            </div>
          ))}
        </div>
      </section>

      <CalculatorSection />

      <RegistryTableSection letters={letters} loading={loading} />

      <section className="oracle" id="oracle">
        <h2 className="section-title">Explainable letter pricing.</h2>
        <p className="section-subtitle">The oracle uses multiple source categories to determine letter prices with full transparency.</p>
        <div className="oracle-sources">
          {[
            { title: "Registry Activity", desc: "Counts letters used in minted Language.fi assets." },
            { title: "Token Name Data", desc: "Counts letters from sampled token names and market-native naming behavior." },
            { title: "Blockchain Hash Data", desc: "Uses sampled hashes and addresses as a cryptographic frequency baseline." },
            { title: "Text Sample Data", desc: "Uses permitted or licensed text samples, public metadata, RSS feeds, or derived frequency counts." },
            { title: "Seasonal and Meme Trends", desc: "Captures temporary demand spikes from cultural naming patterns." },
          ].map(({ title, desc }) => (
            <div key={title} className="oracle-source-card">
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
        <div className="formula-display">
          <div className="formula-title">Pricing Formula</div>
          <div className="formula-content">
            Letter Price = Base Price + Registry Demand + Token Name Demand + Hash Baseline + Text Sample Demand + Seasonal Modifier + Popularity Tax - Decay Adjustment
          </div>
        </div>
        <div className="compliance-note">
          <strong>Important:</strong> Language.fi stores derived counts and statistics from third-party text sources, not full copyrighted articles.
        </div>
      </section>

      <div className="manifesto">
        <h2 className="manifesto-quote">Bitcoin made numbers scarce. NFTs made images scarce. Language.fi makes language programmable.</h2>
        <p className="manifesto-sub">Every letter has a price. Every sentence has a cost. Every phrase can become a registered asset.</p>
      </div>

      <div className="final-cta">
        <h2>Start minting meaning.</h2>
        <div className="final-cta-buttons">
          <button className="btn-primary" onClick={() => navigate("/explorer")}>Launch App</button>
          <button className="btn-secondary" onClick={() => scrollTo("oracle")}>View Docs</button>
        </div>
      </div>
    </>
  );
}
