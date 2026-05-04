const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function scoreLeadsWithAPI(leads) {
  const response = await fetch(`${API_URL}/api/leads/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leads }),
  });
  if (!response.ok) {
    let message = `Scoring API error: ${response.status}`;
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      // Keep the generic status message when the API does not return JSON.
    }
    throw new Error(message);
  }

  const data = await response.json();
  return (data.leads || []).map((scoredLead) => ({
    ...(scoredLead.lead || {}),
    ...scoredLead,
  }));
}

export function normalizeRevenue(raw) {
  if (!raw) return null;
  const s = String(raw)
    .toLowerCase()
    .replace(/[,$\s]/g, "");
  const mMatch = s.match(/([\d.]+)m/);
  const kMatch = s.match(/([\d.]+)k/);
  if (mMatch) return parseFloat(mMatch[1]) * 1_000_000;
  if (kMatch) return parseFloat(kMatch[1]) * 1_000;
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
}

export function deduplicateLeads(leads) {
  const seen = new Map();
  return leads.filter((lead) => {
    const domain =
      lead.website || lead.domain || lead.email?.split("@")[1] || "";
    const key =
      domain.replace(/^www\./, "").toLowerCase() ||
      (lead.company || lead.name || "").toLowerCase();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
}

export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getTierColor(tier) {
  const map = { A: "green", B: "blue", C: "amber", D: "red" };
  return map[tier] || "gray";
}

export function getScoreColor(score) {
  if (score >= 75) return "var(--accent)";
  if (score >= 50) return "var(--blue)";
  if (score >= 30) return "var(--amber)";
  return "var(--red)";
}

export function exportToCSV(leads) {
  const headers = [
    "Company",
    "Industry",
    "Location",
    "Employees",
    "Revenue",
    "Overall Score",
    "Tier",
    "Recommended Action",
    "Revenue Fit",
    "Industry Fit",
    "Size Fit",
    "Owner Reachability",
    "Growth Signals",
    "Email",
    "Phone",
    "Website",
    "Acquisition Thesis",
    "EV Range",
  ];
  const rows = leads.map((l) => {
    const s = l.aiScore || {};
    const d = s.dimensions || {};
    return [
      l.company || l.name || "",
      l.industry || "",
      l.location || l.city || "",
      l.employees || "",
      l.revenue || "",
      s.overall_score || "",
      s.tier || "",
      s.recommended_action || "",
      d.revenue_fit || "",
      d.industry_fit || "",
      d.size_fit || "",
      d.owner_reachability || "",
      d.growth_signals || "",
      l.email || "",
      l.phone || "",
      l.website || l.domain || "",
      (s.acquisition_thesis || "").replace(/,/g, ";"),
      s.estimated_ev_range || "",
    ];
  });
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${c}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `caprae-leads-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
