from typing import Any

from pydantic import BaseModel, Field


class LeadIn(BaseModel):
    company: str | None = None
    name: str | None = None
    industry: str | None = None
    sector: str | None = None
    location: str | None = None
    city: str | None = None
    country: str | None = None
    employees: int | float | str | None = None
    employee_count: int | float | str | None = None
    revenue: int | float | str | None = None
    annual_revenue: int | float | str | None = None
    website: str | None = None
    domain: str | None = None
    owner: str | None = None
    contact: str | None = None
    founder: str | None = None
    email: str | None = None
    phone: str | None = None
    title: str | None = None
    description: str | None = None
    notes: str | None = None
    model_config = {"extra": "allow"}


class ScoreDimensions(BaseModel):
    revenue_fit: int = Field(ge=0, le=100)
    industry_fit: int = Field(ge=0, le=100)
    size_fit: int = Field(ge=0, le=100)
    owner_reachability: int = Field(ge=0, le=100)
    growth_signals: int = Field(ge=0, le=100)


class AIScore(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    dimensions: ScoreDimensions
    tier: str
    acquisition_thesis: str
    key_risks: list[str] = Field(default_factory=list)
    key_opportunities: list[str] = Field(default_factory=list)
    recommended_action: str
    estimated_ev_range: str = "Unknown"
    fit_tags: list[str] = Field(default_factory=list)


class ScoredLead(BaseModel):
    id: str
    score: int
    fit: int
    intent: int
    estimatedValue: int
    reasons: list[str]
    nextAction: str
    aiScore: AIScore
    cached: bool = False
    lead: dict[str, Any]


class ScoreRequest(BaseModel):
    leads: list[LeadIn]


class ScoreResponse(BaseModel):
    leads: list[ScoredLead]


class ExportRequest(BaseModel):
    leads: list[ScoredLead]
    limit: int = 50
    format: str = "csv"
