import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import HomePage from "@/pages/HomePage";
import ExplorerPage from "@/pages/ExplorerPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import StakePage from "@/pages/StakePage";
import PrimitivesPage from "@/pages/PrimitivesPage";
import LetterPage from "@/pages/LetterPage";
import PrimitiveDetailPage from "@/pages/PrimitiveDetailPage";
import TerminalPage from "@/pages/TerminalPage";
import DocsPage from "@/pages/DocsPage";
import SourcesPage from "@/pages/SourcesPage";
import AlchemistPage from "@/pages/AlchemistPage";
import AppraisalPage from "@/pages/AppraisalPage";
import LiveTicker from "@/components/LiveTicker";
import SolanaWallet from "@/components/SolanaWallet";

function Nav() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const nav = (path: string) => navigate(path);

  const isActive = (path: string) => location === path;

  return (
    <nav style={{ background: scrolled ? "rgba(8,8,14,0.99)" : "rgba(8,8,14,0.92)" }}>
      <div className="nav-container">
        <span className="logo" onClick={() => nav("/")}>MEMBRA</span>
        <ul className={`nav-links${menuOpen ? " open" : ""}`}>
          <li><span onClick={() => nav("/terminal")} className={isActive("/terminal") ? "active" : ""}>Terminal</span></li>
          <li><span onClick={() => nav("/primitives")} className={isActive("/primitives") ? "active" : ""}>Primitives</span></li>
          <li><span onClick={() => nav("/leaderboard")} className={isActive("/leaderboard") ? "active" : ""}>Markets</span></li>
          <li><span onClick={() => nav("/alchemist")} className={isActive("/alchemist") ? "active" : ""}>Alchemist</span></li>
          <li><span onClick={() => nav("/sources")} className={isActive("/sources") ? "active" : ""}>Sources</span></li>
          <li><span onClick={() => nav("/docs")} className={isActive("/docs") ? "active" : ""}>Docs</span></li>
          <li><span onClick={() => nav("/stake")} className={isActive("/stake") ? "active" : ""}>Stake</span></li>
          <li>
            <div className="nav-right" style={{ padding: "0 4px" }}>
              <SolanaWallet />
            </div>
          </li>
          <li><button className="nav-cta" onClick={() => nav("/terminal")}>Open Terminal</button></li>
        </ul>
        <div className="nav-right">
          <SolanaWallet />
          <button className="mobile-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const [, navigate] = useLocation();
  return (
    <footer>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--primary)", letterSpacing: "0.14em", marginBottom: "1rem" }}>◈ MEMBRA</div>
      <div className="footer-links">
        <span onClick={() => navigate("/terminal")}>Terminal</span>
        <span onClick={() => navigate("/primitives")}>Primitives</span>
        <span onClick={() => navigate("/leaderboard")}>Markets</span>
        <span onClick={() => navigate("/alchemist")}>Alchemist</span>
        <span onClick={() => navigate("/sources")}>Sources</span>
        <span onClick={() => navigate("/docs")}>API Docs</span>
        <span onClick={() => navigate("/stake")}>Stake</span>
        <span onClick={() => navigate("/explorer")}>Explorer</span>
      </div>
      <p>© 2026 MEMBRA — Semantic Market Observability Infrastructure</p>
      <p className="disclaimer">
        MEMBRA is an experimental DeFi protocol concept. Oracle prices are derived from computational analysis of 30 public data sources. 
        Primitive values are not market values. Ownership of staked sentences does not imply legal ownership of language. 
        Not financial advice. Not investment advice. Experimental only.
      </p>
    </footer>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/terminal" component={TerminalPage} />
      <Route path="/explorer" component={ExplorerPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/stake" component={StakePage} />
      <Route path="/primitives" component={PrimitivesPage} />
      <Route path="/primitives/:symbol" component={PrimitiveDetailPage} />
      <Route path="/letter/:letter" component={LetterPage} />
      <Route path="/alchemist" component={AlchemistPage} />
      <Route path="/appraisal/:letter" component={AppraisalPage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/sources" component={SourcesPage} />
      <Route>
        <div style={{ padding: "10rem 2rem", textAlign: "center" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "5rem", color: "var(--primary)", marginBottom: "1rem" }}>404</div>
          <p style={{ color: "var(--muted-text)", fontFamily: "'IBM Plex Mono', monospace" }}>Primitive not found.</p>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <ScrollToTop />
      <Nav />
      <LiveTicker />
      <main style={{ paddingTop: "94px" }}>
        <Router />
      </main>
      <Footer />
    </WouterRouter>
  );
}
