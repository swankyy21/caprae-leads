import { LayoutDashboard, Target, Upload } from "lucide-react";
import "../Header.css";

export default function Header({ view, setView, leadsCount, onHome }) {
  return (
    <header className="header">
      <div className="header-inner">
        <button
          className="header-brand"
          type="button"
          onClick={onHome}
          aria-label="Go to home"
        >
          <span className="header-logo">
            <Target size={16} strokeWidth={2.5} />
          </span>
          <span className="header-wordmark">
            <span className="header-name">CAPRAE</span>
            <span className="header-sub">LEAD INTELLIGENCE</span>
          </span>
        </button>

        <nav className="header-nav" aria-label="Primary navigation">
          <button
            className={`nav-btn ${view === "upload" ? "active" : ""}`}
            type="button"
            onClick={() => setView("upload")}
          >
            <Upload size={13} />
            Import
          </button>
          {leadsCount > 0 && (
            <button
              className={`nav-btn ${
                view === "dashboard" || view === "detail" ? "active" : ""
              }`}
              type="button"
              onClick={() => setView("dashboard")}
            >
              <LayoutDashboard size={13} />
              Dashboard
              <span className="nav-badge">{leadsCount}</span>
            </button>
          )}
        </nav>

        <div className="header-right">
          <div className="header-pill">
            <span className="header-dot" />
            AI Scoring Active
          </div>
        </div>
      </div>
    </header>
  );
}
