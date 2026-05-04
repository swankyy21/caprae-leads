import { useState } from "react";
import Dashboard from "./components/Dashboard";
import UploadView from "./components/UploadView";
import LeadTable from "./components/LeadTable";
import LeadDetail from "./components/LeadDetail";
import Header from "./components/Header";
import "./App.css";

export default function App() {
  const [view, setView] = useState("upload");
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringProgress, setScoringProgress] = useState(0);

  const handleLeadsScored = (scoredLeads) => {
    setLeads(scoredLeads);
    setView("dashboard");
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setView("detail");
  };

  return (
    <div className="app">
      <Header
        view={view}
        setView={setView}
        leadsCount={leads.length}
        onBack={() => setView(leads.length ? "dashboard" : "upload")}
      />
      <main className="app-main">
        {view === "upload" && (
          <UploadView
            onLeadsScored={handleLeadsScored}
            isScoring={isScoring}
            setIsScoring={setIsScoring}
            scoringProgress={scoringProgress}
            setScoringProgress={setScoringProgress}
          />
        )}
        {view === "dashboard" && (
          <>
            <Dashboard leads={leads} />
            <LeadTable
              leads={leads}
              onSelectLead={handleSelectLead}
              setLeads={setLeads}
            />
          </>
        )}
        {view === "detail" && selectedLead && (
          <LeadDetail lead={selectedLead} onBack={() => setView("dashboard")} />
        )}
      </main>
    </div>
  );
}
