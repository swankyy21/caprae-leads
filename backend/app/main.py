import csv
import io

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from .cache import cache_enabled
from .config import settings
from .database import database_enabled, list_scored_leads
from .schemas import ExportRequest, ScoreRequest, ScoreResponse
from .scoring import score_lead


app = FastAPI(title="Caprae Leads API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/system/status")
def system_status() -> dict[str, bool | str]:
    return {
        "status": "ok",
        "claude_configured": bool(settings.anthropic_api_key),
        "fallback_scoring_enabled": settings.allow_fallback_scoring,
        "supabase_configured": database_enabled(),
        "redis_configured": cache_enabled(),
    }


@app.get("/api/leads")
async def get_leads(limit: int = 100) -> dict[str, list[dict]]:
    return {"leads": await list_scored_leads(limit=limit)}


@app.post("/api/leads/score", response_model=ScoreResponse)
async def score_leads(payload: ScoreRequest) -> ScoreResponse:
    scored = []
    for lead in payload.leads:
        scored.append(await score_lead(lead))
    scored.sort(key=lambda item: item.score, reverse=True)
    return ScoreResponse(leads=scored)


@app.post("/api/export/json")
def export_json(payload: ExportRequest) -> list[dict]:
    return [
        lead.model_dump()
        for lead in sorted(payload.leads, key=lambda item: item.score, reverse=True)[: payload.limit]
    ]


@app.post("/api/export/csv")
def export_csv(payload: ExportRequest) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
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
        ]
    )

    for scored in sorted(payload.leads, key=lambda item: item.score, reverse=True)[: payload.limit]:
        lead = scored.lead
        score = scored.aiScore
        dimensions = score.dimensions
        writer.writerow(
            [
                lead.get("company", ""),
                lead.get("industry", ""),
                lead.get("location", ""),
                lead.get("employees", ""),
                lead.get("revenue", ""),
                score.overall_score,
                score.tier,
                score.recommended_action,
                dimensions.revenue_fit,
                dimensions.industry_fit,
                dimensions.size_fit,
                dimensions.owner_reachability,
                dimensions.growth_signals,
                lead.get("email", ""),
                lead.get("phone", ""),
                lead.get("website", ""),
                score.acquisition_thesis,
                score.estimated_ev_range,
            ]
        )

    return Response(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=caprae-leads.csv"},
    )
