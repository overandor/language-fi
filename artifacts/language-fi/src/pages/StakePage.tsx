import { useState } from "react";

interface StakeResult {
  sentence: string;
  base_value_lgu: number;
  stillness_days: number;
  stillness_multiplier: number;
  weekly_performance: number;
  final_staking_score: number;
}

export default function StakePage() {
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<StakeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStake = async () => {
    if (!sentence.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stake-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stake-container">
      <h1 className="section-title">Sentence Staking</h1>
      <p className="section-subtitle">
        Stake a sentence to earn stillness rewards. The longer your sentence stays unmoved, the higher your staking multiplier.
      </p>

      <div className="stake-form">
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ color: "var(--muted-text)", fontSize: "0.8rem", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
            Your Sentence
          </label>
          <input
            className="stake-input"
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="TYPE YOUR SENTENCE TO STAKE..."
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleStake}
          disabled={loading || !sentence.trim()}
          style={{ opacity: loading ? 0.7 : 1, width: "100%" }}
        >
          {loading ? "Calculating..." : "Calculate Staking Score"}
        </button>
      </div>

      {result && (
        <div className="stake-result">
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.1rem", color: "var(--electric-blue)", marginBottom: "0.5rem" }}>
              "{result.sentence}"
            </div>
            <div className="live-indicator" style={{ display: "inline-flex" }}>
              <span className="live-dot" /> Live Score
            </div>
          </div>

          {[
            { label: "Base Character Value", value: `${result.base_value_lgu.toFixed(3)} LGU` },
            { label: "Stillness Days", value: `${result.stillness_days} days` },
            { label: "Stillness Multiplier", value: `×${result.stillness_multiplier.toFixed(3)}` },
            { label: "Weekly Performance", value: `+${(result.weekly_performance * 100).toFixed(1)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="stake-row">
              <span className="stake-label">{label}</span>
              <span className="stake-value">{value}</span>
            </div>
          ))}

          <div className="stake-row" style={{ borderTop: "1px solid var(--border)", marginTop: "0.5rem", paddingTop: "1rem" }}>
            <span style={{ color: "var(--soft-white)", fontWeight: 600 }}>Final Staking Score</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: "var(--neon-green)", fontSize: "1.25rem" }}>
              {result.final_staking_score.toFixed(3)} LGU
            </span>
          </div>
        </div>
      )}

      <div style={{ marginTop: "3rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "2rem" }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "1rem", color: "var(--soft-white)" }}>How Staking Works</h3>
        <div style={{ display: "grid", gap: "1rem" }}>
          {[
            { n: "1", text: "Your sentence is valued by summing the oracle prices of each character." },
            { n: "2", text: "Each day your sentence stays unmoved adds to a stillness multiplier." },
            { n: "3", text: "Weekly character price performance compounds into your final score." },
            { n: "4", text: "Diverse character usage earns a rarity bonus. Repetitive sentences score lower." },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontWeight: 700, minWidth: 24 }}>{n}.</span>
              <span style={{ color: "var(--muted-text)", fontSize: "0.9rem" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
