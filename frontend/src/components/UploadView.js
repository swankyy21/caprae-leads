import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { FileUp, Loader2, Wand2 } from "lucide-react";
import { deduplicateLeads, scoreLeadsWithAPI } from "../utils/scoring";

function normalizeNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value || "").replace(/[$,\s]/g, "")) || 0;
}

function normalizeLead(row, index) {
  const company = row.company || row.Company || row.account || row.Account || "";
  const contact = row.contact || row.Contact || row.name || row.Name || "";
  const email = row.email || row.Email || "";
  const title = row.title || row.Title || row.role || row.Role || "";
  const industry = row.industry || row.Industry || "Unknown";
  const employees = normalizeNumber(row.employees || row.Employees || row.size);
  const revenue = normalizeNumber(row.revenue || row.Revenue || row.arr || row.ARR);
  const notes = row.notes || row.Notes || row.description || row.Description || "";

  return {
    id: `${company || "lead"}-${index}-${email || contact}`.replace(/\s+/g, "-"),
    company: company || `Lead ${index + 1}`,
    contact: contact || "Unknown contact",
    email,
    title: title || "Unknown role",
    industry,
    employees,
    revenue,
    location: row.location || row.Location || "Unknown",
    website: row.website || row.Website || "",
    notes,
  };
}

export default function UploadView({
  onLeadsScored,
  isScoring,
  setIsScoring,
  scoringProgress,
  setScoringProgress,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const csvExample = useMemo(
    () => "company,contact,email,title,industry,employees,revenue,location,website,notes",
    []
  );

  const scoreRows = async (rows) => {
    const normalized = rows
      .filter((row) => Object.values(row).some(Boolean))
      .map(normalizeLead);
    const uniqueLeads = deduplicateLeads(normalized);

    if (!uniqueLeads.length) {
      setError("No usable lead rows were found.");
      return;
    }

    setError("");
    setIsScoring(true);
    setScoringProgress(12);

    try {
      setScoringProgress(35);
      const scored = await scoreLeadsWithAPI(uniqueLeads);
      setScoringProgress(100);
      onLeadsScored(scored);
    } catch (apiError) {
      setError(apiError.message || "Scoring failed. Check backend configuration.");
      setScoringProgress(0);
    } finally {
      window.setTimeout(() => setIsScoring(false), 250);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => scoreRows(data),
      error: () => setError("Could not parse that CSV file."),
    });
  };

  return (
    <section className="upload-view fade-up">
      <div className="upload-copy">
        <p className="eyebrow">CSV lead scoring</p>
        <h1>Import accounts and rank the best sales conversations first.</h1>
        <p>
          Upload a CSV with firmographic and owner/contact fields. The backend
          scores each row with Claude, caches repeat companies, and persists
          results to Supabase.
        </p>
      </div>

      <div className="upload-panel">
        <button
          className="dropzone"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isScoring}
        >
          {isScoring ? <Loader2 className="spin" size={30} /> : <FileUp size={30} />}
          <strong>{isScoring ? "Scoring leads" : "Choose CSV file"}</strong>
          <span>{csvExample}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          hidden
        />

        {isScoring && (
          <div className="progress-shell" aria-label="Scoring progress">
            <span style={{ width: `${scoringProgress}%` }} />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="upload-actions">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isScoring}
          >
            <Wand2 size={16} />
            Import CSV
          </button>
        </div>
      </div>
    </section>
  );
}
