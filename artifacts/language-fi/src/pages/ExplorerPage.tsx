import { useLocation } from "wouter";

export default function ExplorerPage() {
  const [, navigate] = useLocation();

  const cards = [
    {
      icon: "A",
      title: "Letter Explorer",
      desc: "Live market dashboard for the alphabet. Track prices, usage, protocol breakdown, Gate.io token popularity, weekly markets, and settlement proofs.",
      stats: [
        { label: "Letters Tracked", value: "26" },
        { label: "Protocols", value: "8" },
      ],
      cta: "Explore Letters →",
      onClick: () => {
        navigate("/");
        setTimeout(() => document.getElementById("letters")?.scrollIntoView({ behavior: "smooth" }), 120);
      },
    },
    {
      icon: "W",
      title: "Word Value Engine",
      desc: "Compose words from priced letters. See real-time formula value, character breakdown, mint cost estimation, and popularity tax.",
      stats: [
        { label: "Oracle Sources", value: "5" },
        { label: "Update Rate", value: "Live" },
      ],
      cta: "Calculate Value →",
      onClick: () => {
        navigate("/");
        setTimeout(() => document.getElementById("words")?.scrollIntoView({ behavior: "smooth" }), 120);
      },
    },
    {
      icon: "S",
      title: "Sentence Staking",
      desc: "Mint sentences into registered assets. Configure stillness mining, track your staking score, and view leaderboard rankings.",
      stats: [
        { label: "Staked Sentences", value: "2,847" },
        { label: "Avg Stillness", value: "73d" },
      ],
      cta: "Stake Sentence →",
      onClick: () => navigate("/stake"),
    },
    {
      icon: "◼",
      title: "Slot Market",
      desc: "Buy prepaid minting capacity slots before you know your sentence. Trade unfilled slots in the secondary market.",
      stats: [
        { label: "Available Slots", value: "1,204" },
        { label: "Floor Price", value: "0.25 LGU" },
      ],
      cta: "Browse Slots →",
    },
    {
      icon: "◈",
      title: "Registry",
      desc: "Public ledger of all registered linguistic assets. View ownership history, transfer records, and hash proofs.",
      stats: [
        { label: "Registered Assets", value: "18,432" },
        { label: "Transfers", value: "4,201" },
      ],
      cta: "View Registry →",
      onClick: () => navigate("/leaderboard"),
    },
    {
      icon: "◉",
      title: "Primitives Oracle",
      desc: "Explore the full primitive set: letters, numbers, spaces, and symbols. See pricing weights, oracle confidence, and source breakdowns.",
      stats: [
        { label: "Primitives", value: "44" },
        { label: "Update Cycle", value: "Weekly" },
      ],
      cta: "View Primitives →",
      onClick: () => navigate("/primitives"),
    },
  ];

  return (
    <>
      <section className="explorer-hero">
        <h1 className="explorer-title">Protocol Explorer</h1>
        <p className="explorer-subtitle">
          Navigate the linguistic asset protocol. Track letters, explore words, view sentences, and monitor oracle data.
        </p>
      </section>

      <div className="explorer-grid">
        {cards.map((card) => (
          <div
            key={card.title}
            className="explorer-card"
            onClick={card.onClick}
            style={{ cursor: card.onClick ? "pointer" : "default" }}
          >
            <div className="explorer-icon">{card.icon}</div>
            <h2>{card.title}</h2>
            <p>{card.desc}</p>
            <div className="explorer-stats">
              {card.stats.map((s) => (
                <div key={s.label} className="explorer-stat">
                  <div className="explorer-stat-label">{s.label}</div>
                  <div className="explorer-stat-value">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="explorer-cta">{card.cta}</div>
          </div>
        ))}
      </div>
    </>
  );
}
