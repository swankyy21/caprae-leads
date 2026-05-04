import asyncio
import re
from typing import Any
from urllib.parse import urlparse

import dns.resolver

from .schemas import LeadIn


EMAIL_RE = re.compile(r"^[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})$", re.IGNORECASE)
REVENUE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*([kmb])?", re.IGNORECASE)


def normalize_domain(value: Any) -> str:
    if not value:
        return ""

    raw = str(value).strip().lower()
    if "@" in raw and not raw.startswith(("http://", "https://")):
        raw = raw.rsplit("@", 1)[-1]
    if not raw.startswith(("http://", "https://")):
        raw = f"https://{raw}"

    parsed = urlparse(raw)
    domain = parsed.netloc or parsed.path
    domain = domain.split("@")[-1].split(":")[0].strip(".")
    if domain.startswith("www."):
        domain = domain[4:]
    return domain


def _apply_suffix(number: float, suffix: str) -> int:
    multiplier = {"k": 1_000, "m": 1_000_000, "b": 1_000_000_000}.get(suffix.lower(), 1)
    return int(number * multiplier)


def _format_money(value: int) -> str:
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:g}B"
    if value >= 1_000_000:
        return f"${value / 1_000_000:g}M"
    if value >= 1_000:
        return f"${value / 1_000:g}K"
    return f"${value:g}"


def normalize_revenue_range(value: Any) -> dict[str, int | str | None]:
    if value is None or value == "":
        return {"min": None, "max": None, "midpoint": None, "label": ""}
    if isinstance(value, int | float):
        amount = int(value)
        return {"min": amount, "max": amount, "midpoint": amount, "label": _format_money(amount)}

    text = str(value).lower().replace(",", "").replace("$", "").strip()
    matches = REVENUE_RE.findall(text)
    if not matches:
        return {"min": None, "max": None, "midpoint": None, "label": ""}

    inferred_suffix = next((suffix for _, suffix in reversed(matches) if suffix), "")
    amounts = [
        _apply_suffix(float(number), suffix or inferred_suffix)
        for number, suffix in matches
    ]
    low = min(amounts)
    high = max(amounts)
    midpoint = round((low + high) / 2)
    label = _format_money(low) if low == high else f"{_format_money(low)}-{_format_money(high)}"
    return {"min": low, "max": high, "midpoint": midpoint, "label": label}


def validate_email_syntax(email: Any) -> tuple[bool, str]:
    if not email:
        return False, ""
    match = EMAIL_RE.match(str(email).strip())
    return bool(match), normalize_domain(match.group(1)) if match else ""


def _has_mx_record(domain: str) -> bool:
    if not domain:
        return False
    resolver = dns.resolver.Resolver()
    resolver.lifetime = 2
    resolver.timeout = 1
    try:
        return bool(resolver.resolve(domain, "MX"))
    except (dns.resolver.DNSException, TimeoutError):
        return False


async def validate_email(email: Any) -> dict[str, bool | str]:
    syntax_valid, domain = validate_email_syntax(email)
    mx_valid = await asyncio.to_thread(_has_mx_record, domain) if syntax_valid else False
    return {
        "email_syntax_valid": syntax_valid,
        "email_mx_valid": mx_valid,
        "email_valid": syntax_valid and mx_valid,
        "email_domain": domain,
    }


async def clean_leads(leads: list[LeadIn]) -> list[dict[str, Any]]:
    raw_leads = [lead.model_dump(exclude_none=True) for lead in leads]
    email_checks = await asyncio.gather(
        *(validate_email(lead.get("email")) for lead in raw_leads)
    )

    cleaned: list[dict[str, Any]] = []
    seen: set[str] = set()
    for lead, email_check in zip(raw_leads, email_checks, strict=True):
        revenue_range = normalize_revenue_range(lead.get("revenue") or lead.get("annual_revenue"))
        website_domain = normalize_domain(lead.get("website") or lead.get("domain"))
        dedupe_domain = website_domain or str(email_check["email_domain"])
        dedupe_key = dedupe_domain or (lead.get("company") or lead.get("name") or "").strip().lower()

        if dedupe_key and dedupe_key in seen:
            continue
        if dedupe_key:
            seen.add(dedupe_key)

        cleaned.append(
            {
                **lead,
                **email_check,
                "domain": dedupe_domain or lead.get("domain") or "",
                "website": lead.get("website") or website_domain,
                "revenue": revenue_range["midpoint"] or lead.get("revenue") or lead.get("annual_revenue"),
                "revenue_min": revenue_range["min"],
                "revenue_max": revenue_range["max"],
                "revenue_range": revenue_range["label"],
            }
        )

    return cleaned
