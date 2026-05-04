import re
from typing import Any


def normalize_number(value: Any) -> int:
    if value is None or value == "":
        return 0
    if isinstance(value, int | float):
        return int(value)

    text = str(value).lower().replace(",", "").replace("$", "").strip()
    match = re.search(r"([\d.]+)\s*([mkb])?", text)
    if not match:
        return 0

    number = float(match.group(1))
    suffix = match.group(2)
    if suffix == "k":
        number *= 1_000
    elif suffix == "m":
        number *= 1_000_000
    elif suffix == "b":
        number *= 1_000_000_000
    return int(number)
