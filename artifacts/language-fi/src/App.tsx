import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import HomePage from "@/pages/HomePage";
import ExplorerPage from "@/pages/ExplorerPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import StakePage from "@/pages/StakePage";
import PrimitivesPage from "@/pages/PrimitivesPage";
import LetterPage from "@/pages/LetterPage";
import PrimitiveDetailPage from "@/pages/PrimitiveDetailPage";

function Nav() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const scrollTo = (id: string) => {
    if (location !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav style={{ background: scrolled ? "rgba(5,5,10,0.98)" : "rgba(5,5,10,0.85)" }}>
      <div className="nav-container">
        <span className="logo" onClick={() => navigate("/")}>LANGUAGE.FI</span>
        <ul className={`nav-links${menuOpen ? " open" : ""}`}>
          <li><span onClick={() => scrollTo("protocol")} className={location === "/" ? "" : ""}>Protocol</span></li>
          <li><span onClick={() => navigate("/explorer")} className={location === "/explorer" ? "active" : ""}>Explorer</span></li>
          <li><span onClick={() => scrollTo("letters")}>Letters</span></li>
          <li><span onClick={() => scrollTo("words")}>Words</span></li>
          <li><span onClick={() => scrollTo("sentences")}>Sentences</span></li>
          <li><span onClick={() => scrollTo("oracle")}>Oracle</span></li>
          <li><span onClick={() => navigate("/primitives")}>Primitives</span></li>
          <li><button className="nav-cta" onClick={() => navigate("/explorer")}>Launch App</button></li>
        </ul>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
    </nav>
  );
}

function Footer() {
  const [, navigate] = useLocation();
  return (
    <footer>
      <div className="footer-links">
        <span onClick={() => navigate("/explorer")}>Explorer</span>
        <span onClick={() => { navigate("/"); setTimeout(() => document.getElementById("letters")?.scrollIntoView({ behavior: "smooth" }), 300); }}>Letters</span>
        <span onClick={() => { navigate("/"); setTimeout(() => document.getElementById("words")?.scrollIntoView({ behavior: "smooth" }), 300); }}>Words</span>
        <span onClick={() => { navigate("/"); setTimeout(() => document.getElementById("sentences")?.scrollIntoView({ behavior: "smooth" }), 300); }}>Sentences</span>
        <span onClick={() => { navigate("/"); setTimeout(() => document.getElementById("oracle")?.scrollIntoView({ behavior: "smooth" }), 300); }}>Oracle</span>
        <span onClick={() => navigate("/leaderboard")}>Leaderboard</span>
        <span onClick={() => navigate("/stake")}>Stake</span>
        <span onClick={() => navigate("/primitives")}>Primitives</span>
      </div>
      <p>© 2026 Language.fi — Language is liquidity.</p>
      <p className="disclaimer">
        <strong>Important:</strong> Experimental protocol concept. Formula value is not market value. Registry ownership does not imply legal ownership of ordinary language. Not financial advice. Not investment advice. Use at your own risk.
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
      <Route path="/explorer" component={ExplorerPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/stake" component={StakePage} />
      <Route path="/primitives" component={PrimitivesPage} />
      <Route path="/primitives/:symbol" component={PrimitiveDetailPage} />
      <Route path="/letter/:letter" component={LetterPage} />
      <Route>
        <div style={{ padding: "10rem 2rem", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--electric-blue)", marginBottom: "1rem" }}>404</h1>
          <p style={{ color: "var(--muted-text)" }}>Page not found.</p>
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
      <main style={{ paddingTop: 0 }}>
        <Router />
      </main>
      <Footer />
    </WouterRouter>
  );
}
