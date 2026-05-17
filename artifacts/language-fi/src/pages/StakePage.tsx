import { useState, useEffect } from "react";

interface SpacePrice {
  price: number;
  change_24h: number;
  rank: string;
}

interface StakeResult {
  sentence: string;
  sentence_hash: string;
  base_value_lgu: number;
  days_staked: number;
  stillness_multiplier: number;
  diversity_multiplier: number;
  spam_score: number;
  weekly_performance: number;
  final_score: number;
  final_staking_score: number;
  character_counts: Record<string, number>;
  character_performance: Record<string, { weight: number; performance: number }>;
}

interface PriceResult {
  sentence: string;
  characters: Array<{ symbol: string; count: number; unit_price_lgu: number; total: number }>;
  base_price: number;
  minting_fee: number;
  final_price: number;
  character_breakdown: Record<string, { count: number; price: number }>;
}

interface TransferResult {
  sentence_hash: string;
  transfer_type: string;
  previous_stillness_days: number;
  previous_multiplier: number;
  new_stillness_days: number;
  new_multiplier: number;
  stillness_preserved: string;
  transfer_status: string;
}

const STILLNESS_TIERS = [
  { range: "0–7 days", multiplier: "1.00×" },
  { range: "8–30 days", multiplier: "1.10×" },
  { range: "31–90 days", multiplier: "1.25×" },
  { range: "91–180 days", multiplier: "1.50×" },
  { range: "181–365 days", multiplier: "2.00×" },
  { range: "365+ days", multiplier: "3.00×", highlight: true },
];

export default function StakePage() {
  const [tab, setTab] = useState<"stake" | "buy" | "transfer">("stake");
  const [spacePrice, setSpacePrice] = useState<SpacePrice | null>(null);

  // Stake tab state
  const [stakeSentence, setStakeSentence] = useState("");
  const [stakeResult, setStakeResult] = useState<StakeResult | null>(null);
  const [stakeLoading, setStakeLoading] = useState(false);
  const [stakeError, setStakeError] = useState("");

  // Buy tab state
  const [buySentence, setBuySentence] = useState("");
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyConfirmed, setBuyConfirmed] = useState(false);

  // Transfer tab state
  const [sentenceHash, setSentenceHash] = useState("");
  const [transferType, setTransferType] = useState("hard");
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");

  useEffect(() => {
    fetch("/api/space-price").then(r => r.json()).then(d => setSpacePrice(d)).catch(() => {});
  }, []);

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakeSentence.trim()) return;
    setStakeLoading(true);
    setStakeError("");
    setStakeResult(null);
    try {
      const res = await fetch("/api/stake-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: stakeSentence }),
      });
      const data = await res.json();
      if (data.error) { setStakeError(data.error); return; }
      setStakeResult(data);
    } catch {
      setStakeError("Error staking sentence. Please try again.");
    } finally {
      setStakeLoading(false);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buySentence.trim()) return;
    setBuyLoading(true);
    setPriceResult(null);
    setBuyConfirmed(false);
    try {
      const res = await fetch("/api/calculate-sentence-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: buySentence }),
      });
      const data = await res.json();
      setPriceResult(data);
    } catch {
      // ignore
    } finally {
      setBuyLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentenceHash.trim()) return;
    setTransferLoading(true);
    setTransferError("");
    setTransferResult(null);
    try {
      const res = await fetch("/api/transfer-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence_hash: sentenceHash, transfer_type: transferType }),
      });
      const data = await res.json();
      if (data.error) { setTransferError(data.error); return; }
      setTransferResult(data);
    } catch {
      setTransferError("Error processing transfer. Please try again.");
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="stake-container">
      <div className="stake-header" style={{ marginBottom: "2rem" }}>
        <h1 className="section-title">Sentence Staking</h1>
        <p className="section-subtitle">
          Stake sentences as character baskets with stillness mining. The longer your sentence stays unmoved, the higher your staking multiplier.
        </p>
      </div>

      {/* Tabs */}
      <div className="stake-tabs" style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {(["stake", "buy", "transfer"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? "var(--electric-blue)" : "transparent"}`,
              color: tab === t ? "var(--soft-white)" : "var(--muted-text)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              padding: "0.75rem 1.25rem",
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "color 0.2s, border-color 0.2s",
              marginBottom: "-1px",
            }}
          >
            {t === "stake" ? "Stake Sentence" : t === "buy" ? "Buy Sentence" : "Transfer"}
          </button>
        ))}
      </div>

      {/* ── Stake Tab ── */}
      {tab === "stake" && (
        <div className="stake-layout">
          <div>
            <div className="stake-form" style={{ marginBottom: stakeResult ? "2rem" : 0 }}>
              <form onSubmit={handleStake}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                    Enter Sentence
                  </label>
                  <input
                    className="stake-input"
                    type="text"
                    value={stakeSentence}
                    onChange={e => setStakeSentence(e.target.value)}
                    placeholder="BUILD ON BASE 2026"
                    maxLength={100}
                    required
                    style={{ width: "100%" }}
                  />
                  <small style={{ color: "var(--muted-text)", fontSize: "0.75rem", marginTop: "0.35rem", display: "block" }}>
                    Spaces count as linguistic separator assets
                  </small>
                </div>
                {stakeError && <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{stakeError}</div>}
                <button type="submit" className="btn-primary" disabled={stakeLoading || !stakeSentence.trim()} style={{ width: "100%", opacity: stakeLoading ? 0.7 : 1 }}>
                  {stakeLoading ? "Calculating..." : "Stake Sentence"}
                </button>
              </form>
            </div>

            {stakeResult && (
              <div className="stake-result">
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "1.1rem", color: "var(--electric-blue)", marginBottom: "0.5rem" }}>
                    "{stakeResult.sentence}"
                  </div>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--muted-text)", fontSize: "0.8rem" }}>{stakeResult.sentence_hash}</span>
                    <span className={`status-badge ${stakeResult.spam_score > 70 ? "active" : "inactive"}`}>
                      {stakeResult.spam_score > 70 ? "Reward Eligible" : "Not Eligible"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  {[
                    { label: "Staking Score", value: `+${(stakeResult.weekly_performance * 100).toFixed(1)}%`, color: "var(--neon-green)" },
                    { label: "Days Staked", value: `${stakeResult.days_staked} days`, color: "var(--electric-blue)" },
                    { label: "Stillness Bonus", value: `${stakeResult.stillness_multiplier}×`, color: "var(--electric-blue)" },
                    { label: "Diversity Bonus", value: `${stakeResult.diversity_multiplier.toFixed(3)}×`, color: "var(--electric-blue)" },
                    { label: "Anti-Spam Score", value: String(stakeResult.spam_score), color: stakeResult.spam_score > 70 ? "var(--neon-green)" : "#f87171" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "var(--elevated-surface)", borderRadius: "8px", padding: "1rem" }}>
                      <div style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontSize: "1.1rem", fontWeight: 700 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="stake-row" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                  <span style={{ color: "var(--soft-white)", fontWeight: 600 }}>Final Staking Score</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: "var(--neon-green)", fontSize: "1.35rem" }}>
                    {stakeResult.final_staking_score.toFixed(3)} LGU
                  </span>
                </div>

                {/* Character Exposure */}
                {Object.keys(stakeResult.character_performance).length > 0 && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1rem", marginBottom: "0.75rem", color: "var(--soft-white)" }}>Weekly Character Performance</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.5rem" }}>
                      {Object.entries(stakeResult.character_performance).map(([char, perf]) => (
                        <div key={char} style={{ background: "var(--elevated-surface)", borderRadius: "6px", padding: "0.6rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontWeight: 700 }}>{char}</span>
                            <span style={{ color: "var(--muted-text)", fontSize: "0.75rem", marginLeft: "0.4rem" }}>{stakeResult.character_counts[char]}×</span>
                          </div>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: perf.performance >= 0 ? "var(--neon-green)" : "#f87171", fontSize: "0.8rem" }}>
                            {perf.performance >= 0 ? "+" : ""}{perf.performance}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
                  <button className="btn-secondary" onClick={() => setStakeResult(null)}>Stake Another</button>
                </div>
              </div>
            )}
          </div>

          {/* Space Card + Stillness schedule */}
          <div className="stake-sidebar" style={{ minWidth: "220px" }}>
            {spacePrice && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.95rem", marginBottom: "1rem", color: "var(--soft-white)" }}>SPACE Character</h3>
                {[
                  { label: "Current Price", value: `${spacePrice.price} LGU`, color: "var(--neon-green)" },
                  { label: "24h Change", value: `${spacePrice.change_24h >= 0 ? "+" : ""}${spacePrice.change_24h}%`, color: spacePrice.change_24h >= 0 ? "var(--neon-green)" : "#f87171" },
                  { label: "Rank", value: spacePrice.rank, color: "var(--electric-blue)" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--muted-text)", fontSize: "0.8rem" }}>{label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontSize: "0.85rem" }}>{value}</span>
                  </div>
                ))}
                <p style={{ color: "var(--muted-text)", fontSize: "0.75rem", marginTop: "0.75rem", lineHeight: 1.5 }}>
                  Linguistic separator token — spaces add structural value to sentences
                </p>
              </div>
            )}

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.25rem" }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--soft-white)" }}>Stillness Mining Schedule</h3>
              {STILLNESS_TIERS.map(({ range, multiplier, highlight }) => (
                <div key={range} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.4rem 0.5rem", borderRadius: "4px", marginBottom: "0.25rem",
                  background: highlight ? "rgba(163,230,53,0.08)" : "transparent",
                  border: highlight ? "1px solid rgba(163,230,53,0.2)" : "1px solid transparent",
                }}>
                  <span style={{ color: "var(--muted-text)", fontSize: "0.78rem" }}>{range}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: highlight ? "var(--neon-green)" : "var(--electric-blue)", fontSize: "0.85rem", fontWeight: highlight ? 700 : 400 }}>{multiplier}</span>
                </div>
              ))}
              <p style={{ color: "#f87171", fontSize: "0.72rem", marginTop: "0.75rem", lineHeight: 1.5 }}>
                ⚠️ Transfer resets stillness bonus. Vaulted transfer preserves partial stillness.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Buy Tab ── */}
      {tab === "buy" && (
        <div>
          <div className="stake-form" style={{ maxWidth: "560px", marginBottom: priceResult ? "2rem" : 0 }}>
            <form onSubmit={handleBuy}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                  Enter Sentence
                </label>
                <input
                  className="stake-input"
                  type="text"
                  value={buySentence}
                  onChange={e => setBuySentence(e.target.value)}
                  placeholder="BUILD ON BASE 2026"
                  maxLength={100}
                  required
                  style={{ width: "100%" }}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={buyLoading || !buySentence.trim()} style={{ width: "100%", opacity: buyLoading ? 0.7 : 1 }}>
                {buyLoading ? "Calculating..." : "Calculate Price"}
              </button>
            </form>
          </div>

          {priceResult && (
            <div className="stake-result" style={{ maxWidth: "560px" }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "1rem", color: "var(--soft-white)" }}>Sentence Price</h3>
              {[
                { label: "Base Price", value: `${priceResult.base_price} LGU`, bold: false },
                { label: "Minting Fee (5%)", value: `${priceResult.minting_fee} LGU`, bold: false },
                { label: "Total Price", value: `${priceResult.final_price} LGU`, bold: true },
              ].map(({ label, value, bold }) => (
                <div key={label} className="stake-row" style={{ borderTop: bold ? "1px solid var(--border)" : undefined, paddingTop: bold ? "1rem" : undefined, marginTop: bold ? "0.5rem" : undefined }}>
                  <span style={{ color: bold ? "var(--soft-white)" : "var(--muted-text)", fontWeight: bold ? 600 : 400 }}>{label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: bold ? "var(--neon-green)" : "var(--electric-blue)", fontSize: bold ? "1.2rem" : "1rem", fontWeight: bold ? 700 : 400 }}>{value}</span>
                </div>
              ))}

              <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.9rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "var(--soft-white)" }}>Character Breakdown</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {priceResult.characters.map(c => (
                  <div key={c.symbol} style={{ background: "var(--elevated-surface)", borderRadius: "6px", padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontWeight: 700 }}>{c.symbol}</span>
                      <span style={{ color: "var(--muted-text)", fontSize: "0.75rem" }}>{c.count}×</span>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--neon-green)", fontSize: "0.8rem" }}>{c.total} LGU</span>
                  </div>
                ))}
              </div>

              {!buyConfirmed ? (
                <button className="btn-primary" style={{ width: "100%" }} onClick={() => setBuyConfirmed(true)}>
                  Buy Sentence
                </button>
              ) : (
                <div style={{ background: "rgba(163,230,53,0.08)", border: "1px solid rgba(163,230,53,0.3)", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                  <div style={{ color: "var(--neon-green)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>✓ Purchase Confirmed</div>
                  <div style={{ color: "var(--muted-text)", fontSize: "0.8rem", marginTop: "0.5rem" }}>"{priceResult.sentence.toUpperCase()}" registered to your wallet</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Transfer Tab ── */}
      {tab === "transfer" && (
        <div>
          <div className="stake-form" style={{ maxWidth: "520px", marginBottom: transferResult ? "2rem" : 0 }}>
            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                  Sentence Hash
                </label>
                <input
                  className="stake-input"
                  type="text"
                  value={sentenceHash}
                  onChange={e => setSentenceHash(e.target.value)}
                  placeholder="st_847291"
                  required
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ color: "var(--muted-text)", fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                  Transfer Type
                </label>
                <select
                  className="stake-input"
                  value={transferType}
                  onChange={e => setTransferType(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="hard">Hard Transfer (Stillness Resets)</option>
                  <option value="vaulted">Vaulted Transfer (50% Stillness Preserved)</option>
                </select>
              </div>
              {transferError && <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "0.75rem" }}>{transferError}</div>}
              <button type="submit" className="btn-primary" disabled={transferLoading || !sentenceHash.trim()} style={{ width: "100%", opacity: transferLoading ? 0.7 : 1 }}>
                {transferLoading ? "Processing..." : "Transfer Sentence"}
              </button>
            </form>
          </div>

          {transferResult && (
            <div className="stake-result" style={{ maxWidth: "520px" }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "1rem", color: "var(--soft-white)" }}>Transfer Result</h3>
              {[
                { label: "Previous Stillness", value: `${transferResult.previous_stillness_days} days` },
                { label: "Previous Multiplier", value: `${transferResult.previous_multiplier}×` },
                { label: "New Stillness", value: `${transferResult.new_stillness_days} days` },
                { label: "New Multiplier", value: `${transferResult.new_multiplier}×` },
                { label: "Stillness Preserved", value: transferResult.stillness_preserved },
              ].map(({ label, value }) => (
                <div key={label} className="stake-row">
                  <span style={{ color: "var(--muted-text)" }}>{label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)" }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: "1rem", textAlign: "center", color: "var(--neon-green)", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                ✓ Transfer Complete
              </div>
              <button className="btn-secondary" style={{ marginTop: "1rem", width: "100%" }} onClick={() => { setTransferResult(null); setSentenceHash(""); }}>
                Transfer Another
              </button>
            </div>
          )}

          <div style={{ marginTop: "2rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.5rem", maxWidth: "520px" }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.95rem", marginBottom: "0.75rem", color: "var(--soft-white)" }}>Transfer Rules</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {[
                { title: "Hard Transfer", desc: "Moves ownership immediately. Stillness counter resets to 0. New holder starts fresh." },
                { title: "Vaulted Transfer", desc: "Preserves 50% of the current stillness days. Slower but retains partial multiplier." },
              ].map(({ title, desc }) => (
                <div key={title} style={{ display: "flex", gap: "0.75rem" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--electric-blue)", fontWeight: 700, minWidth: 16 }}>•</span>
                  <div>
                    <span style={{ color: "var(--soft-white)", fontWeight: 600, fontSize: "0.875rem" }}>{title}:</span>
                    <span style={{ color: "var(--muted-text)", fontSize: "0.875rem" }}> {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
