from typing import Any

from .config import settings
from .scoring_helpers import normalize_number


def _client():
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def database_enabled() -> bool:
    return bool(settings.supabase_url and settings.supabase_service_role_key)


async def save_scored_lead(
    lead: dict[str, Any],
    score: dict[str, Any],
    cache_key: str,
    cache_hit: bool = False,
) -> None:
    client = _client()
    if client is None:
        return

    lead_payload = {
        "cache_key": cache_key,
        "company": lead.get("company") or lead.get("name"),
        "industry": lead.get("industry") or lead.get("sector"),
        "location": lead.get("location") or lead.get("city") or lead.get("country"),
        "employees": normalize_number(lead.get("employees") or lead.get("employee_count")) or None,
        "revenue": normalize_number(lead.get("revenue") or lead.get("annual_revenue")) or None,
        "website": lead.get("website") or lead.get("domain"),
        "owner": lead.get("owner") or lead.get("contact") or lead.get("founder"),
        "email": lead.get("email"),
        "phone": lead.get("phone"),
        "raw_data": lead,
    }
    inserted = (
        client.table("leads")
        .upsert(lead_payload, on_conflict="cache_key")
        .execute()
    )
    lead_id = inserted.data[0]["id"]

    score_payload = {
        "lead_id": lead_id,
        "cache_key": cache_key,
        "overall_score": score["overall_score"],
        "tier": score["tier"],
        "dimensions": score["dimensions"],
        "acquisition_thesis": score["acquisition_thesis"],
        "key_risks": score.get("key_risks", []),
        "key_opportunities": score.get("key_opportunities", []),
        "recommended_action": score["recommended_action"],
        "estimated_ev_range": score.get("estimated_ev_range", "Unknown"),
        "fit_tags": score.get("fit_tags", []),
        "model": settings.anthropic_model,
        "cache_hit": cache_hit,
    }
    client.table("lead_scores").insert(score_payload).execute()


async def list_scored_leads(limit: int = 100) -> list[dict[str, Any]]:
    client = _client()
    if client is None:
        return []

    response = (
        client.table("lead_scores")
        .select("*, leads(*)")
        .order("overall_score", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []
