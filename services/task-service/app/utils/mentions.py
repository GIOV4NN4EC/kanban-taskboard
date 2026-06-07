import re
from uuid import UUID

MENTION_PATTERN = re.compile(r"@\[([^\]]+)\]\(([0-9a-fA-F-]{36})\)")


def extract_mentioned_user_ids(body: str) -> list[UUID]:
    seen: set[UUID] = set()
    result: list[UUID] = []
    for match in MENTION_PATTERN.finditer(body):
        user_id = UUID(match.group(2))
        if user_id not in seen:
            seen.add(user_id)
            result.append(user_id)
    return result
