import { useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Copy, Globe, Mail, MapPin, Phone, TrendingUp } from "lucide-react";

function tierLabel(score) {
  if (score >= 80) return "Hot";
  if (score >= 55) return "Warm";
  return "Nurture";
}

function tierClass(score) {
  if (score >= 80) return "tag-green";
  if (score >= 55) return "tag-amber";
  return "tag-gray";
}

function DimBar({ label, value }) {
  return (
    <label>
      {label}
      <span>
        <i style={{ width: `${value}%` }} />
      </span>
      {value}
    </label>
  );
}

export default function LeadDetail({ lead, onBack }) {
  const [copied, setCopied] = useState(false);
  const ai = lead.aiScore || {};
  const dims = ai.dimensions || {};

  const copyOutreach = () => {
    const text = [
      `Company: ${lead.company}`,
      `Contact: ${lead.contact} (${lead.title})`,
      `Email: ${lead.email || "N/A"}`,
      `Industry: ${lead.industry} · ${lead.location}`,
      `AI Score: ${lead.score}/100 — ${tierLabel(lead.score)}`,
      `Tier: ${ai.tier || "N/A"} | EV: ${ai.estimated_ev_range || "Unknown"}`,
      ``,
      `Acquisition Thesis:`,
      ai.acquisition_thesis || "N/A",
      ``,
      `Recommended Action: ${ai.recommended_action || lead.nextAction}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="detail-view fade-up">
      <div className="detail-topbar">
        <button className="btn btn-ghost" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          Back
        </button>
        <button className="btn btn-ghost" type="button" onClick={copyOutreach}>
          {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
          {copied ? "Copied!" : "Copy outreach brief"}
        </button>
      </div>

      <div className="detail-hero">
        <div>
          <p className="eyebrow">Lead profile</p>
          <h1>{lead.company}</h1>
          <p>{lead.contact} · {lead.title}</p>
        </div>
        <div className="score-orbit">
          <span>{lead.score}</span>
          <small>{tierLabel(lead.score)}</small>
        </div>
      </div>

      <div className="detail-grid">
        {/* Account signals */}
        <section className="panel">
          <h2>Account signals</h2>
          <div className="signal-list">
            <p><Building2 size={16} />{lead.industry} · {(lead.employees || 0).toLocaleString()} employees</p>
            <p><MapPin size={16} />{lead.location || "Unknown location"}</p>
            {lead.email && <p><Mail size={16} /><a href={`mailto:${lead.email}`} className="signal-link">{lead.email}</a></p>}
            {!lead.email && <p><Mail size={16} />No email provided</p>}
            {lead.phone && <p><Phone size={16} />{lead.phone}</p>}
            {lead.website && <p><Globe size={16} /><a href={`https://${lead.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="signal-link">{lead.website}</a></p>}
            {!lead.website && <p><Globe size={16} />No website provided</p>}
          </div>

          {ai.estimated_ev_range && ai.estimated_ev_range !== "Unknown" && (
            <div className="ev-badge">
              <TrendingUp size={14} />
              <span>Est. EV: <strong>{ai.estimated_ev_range}</strong></span>
            </div>
          )}
        </section>

        {/* Score dimensions */}
        <section className="panel">
          <h2>Score breakdown</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <span className={`tag ${tierClass(lead.score)}`}>Tier {ai.tier || "?"}</span>
            {(lead.reasons || []).map((r) => (
              <span className="tag tag-blue" key={r}>{r}</span>
            ))}
          </div>
          <div className="score-bars">
            <DimBar label="Revenue" value={dims.revenue_fit || 0} />
            <DimBar label="Industry" value={dims.industry_fit || 0} />
            <DimBar label="Size" value={dims.size_fit || 0} />
            <DimBar label="Outreach" value={dims.owner_reachability || 0} />
            <DimBar label="Growth" value={dims.growth_signals || 0} />
          </div>
        </section>

        {/* Acquisition thesis */}
        {ai.acquisition_thesis && (
          <section className="panel detail-wide">
            <h2>Acquisition thesis</h2>
            <p className="thesis-text">{ai.acquisition_thesis}</p>
          </section>
        )}

        {/* Risks & opportunities */}
        {((ai.key_risks?.length > 0) || (ai.key_opportunities?.length > 0)) && (
          <section className="panel detail-wide risk-opp-grid">
            {ai.key_risks?.length > 0 && (
              <div>
                <h2>Key risks</h2>
                <ul className="insight-list risk-list">
                  {ai.key_risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {ai.key_opportunities?.length > 0 && (
              <div>
                <h2>Key opportunities</h2>
                <ul className="insight-list opp-list">
                  {ai.key_opportunities.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Recommended action */}
        <section className="panel detail-wide">
          <h2>Recommended action</h2>
          <p className="next-action">{ai.recommended_action || lead.nextAction}</p>
          {lead.notes && <p className="lead-notes">{lead.notes}</p>}
        </section>
      </div>
    </section>
  );
}
