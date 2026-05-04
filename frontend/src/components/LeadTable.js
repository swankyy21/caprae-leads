import { useMemo, useState } from "react";
import { ArrowDownUp, Download, Search, Trash2 } from "lucide-react";
import { exportToCSV } from "../utils/scoring";

function tierClass(score) {
  if (score >= 80) return "tag-green";
  if (score >= 55) return "tag-amber";
  return "tag-gray";
}

export default function LeadTable({ leads, onSelectLead, setLeads }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("score");
  const [tierFilter, setTierFilter] = useState("all");

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...leads]
      .filter((lead) => {
        const matchesQuery = [lead.company, lead.contact, lead.industry, lead.title]
          .join(" ")
          .toLowerCase()
          .includes(q);
        const matchesTier =
          tierFilter === "all" ||
          (tierFilter === "hot" && lead.score >= 80) ||
          (tierFilter === "warm" && lead.score >= 55 && lead.score < 80) ||
          (tierFilter === "nurture" && lead.score < 55);
        return matchesQuery && matchesTier;
      })
      .sort((a, b) => {
        if (sortKey === "company") return a.company.localeCompare(b.company);
        if (sortKey === "value") return b.estimatedValue - a.estimatedValue;
        return b.score - a.score;
      });
  }, [leads, query, sortKey, tierFilter]);

  const removeLead = (event, leadId) => {
    event.stopPropagation();
    setLeads((current) => current.filter((lead) => lead.id !== leadId));
  };

  return (
    <section className="panel lead-table-panel">
      <div className="table-toolbar">
        <div>
          <h2>Scored leads</h2>
          <p>{filteredLeads.length} visible accounts</p>
        </div>
        <div className="table-controls">
          <label className="sort-box">
            <select
              value={tierFilter}
              onChange={(event) => setTierFilter(event.target.value)}
              aria-label="Filter by tier"
            >
              <option value="all">All tiers</option>
              <option value="hot">🔥 Hot (80+)</option>
              <option value="warm">🟡 Warm (55+)</option>
              <option value="nurture">⬜ Nurture</option>
            </select>
          </label>
          <label className="search-box">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search leads"
            />
          </label>
          <label className="sort-box">
            <ArrowDownUp size={15} />
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
            >
              <option value="score">Score</option>
              <option value="value">Value</option>
              <option value="company">Company</option>
            </select>
          </label>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => exportToCSV(filteredLeads)}
            title="Export visible leads to CSV"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Buyer</th>
              <th>Industry</th>
              <th>Value</th>
              <th>Score</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                <td>
                  <strong>{lead.company}</strong>
                  <span>{lead.location}</span>
                </td>
                <td>
                  <strong>{lead.contact}</strong>
                  <span>{lead.title}</span>
                </td>
                <td>{lead.industry}</td>
                <td>${lead.estimatedValue.toLocaleString()}</td>
                <td>
                  <span className={`tag ${tierClass(lead.score)}`}>
                    {lead.score}
                  </span>
                </td>
                <td>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-label={`Remove ${lead.company}`}
                    title="Remove lead"
                    onClick={(event) => removeLead(event, lead.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
