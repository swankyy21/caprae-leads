import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, BriefcaseBusiness, Flame, TrendingUp } from "lucide-react";

const tiers = [
  { name: "Hot", min: 80, className: "tag-green" },
  { name: "Warm", min: 55, className: "tag-amber" },
  { name: "Nurture", min: 0, className: "tag-gray" },
];

function scoreTier(score) {
  return tiers.find((tier) => score >= tier.min) || tiers[2];
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

export default function Dashboard({ leads }) {
  const total = leads.length;
  const avgScore = total
    ? leads.reduce((sum, lead) => sum + lead.score, 0) / total
    : 0;
  const hotLeads = leads.filter((lead) => lead.score >= 80).length;
  const avgRevenue = total
    ? leads.reduce((sum, lead) => sum + lead.estimatedValue, 0) / total
    : 0;
  const topIndustry =
    Object.entries(
      leads.reduce((acc, lead) => {
        acc[lead.industry] = (acc[lead.industry] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "No data";

  const chartData = ["0-39", "40-54", "55-69", "70-84", "85-100"].map(
    (range) => {
      const [min, max] = range.split("-").map(Number);
      return {
        range,
        leads: leads.filter((lead) => lead.score >= min && lead.score <= max)
          .length,
      };
    }
  );

  const topLeads = [...leads].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <section className="dashboard fade-up">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Scoring overview</p>
          <h1>Lead intelligence dashboard</h1>
        </div>
        <span className="tag tag-blue">{total} leads scored</span>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon">
            <Award size={18} />
          </span>
          <p>Average score</p>
          <strong>{formatPercent(avgScore)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Flame size={18} />
          </span>
          <p>Hot leads</p>
          <strong>{hotLeads}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <TrendingUp size={18} />
          </span>
          <p>Avg. opportunity</p>
          <strong>${Math.round(avgRevenue).toLocaleString()}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <BriefcaseBusiness size={18} />
          </span>
          <p>Top industry</p>
          <strong>{topIndustry}</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-head">
            <h2>Score distribution</h2>
            <span className="mono subtle">fit x intent</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="range" stroke="#9a9890" tickLine={false} />
                <YAxis allowDecimals={false} stroke="#9a9890" tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(200,240,74,0.06)" }}
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#f0eeea",
                  }}
                />
                <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.range} fill="#c8f04a" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Best opportunities</h2>
            <span className="mono subtle">top 5</span>
          </div>
          <div className="rank-list">
            {topLeads.map((lead, index) => {
              const tier = scoreTier(lead.score);
              return (
                <div className="rank-row" key={lead.id}>
                  <span className="rank-index">{index + 1}</span>
                  <div>
                    <strong>{lead.company}</strong>
                    <p>{lead.contact} · {lead.industry}</p>
                  </div>
                  <span className={`tag ${tier.className}`}>{lead.score}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
