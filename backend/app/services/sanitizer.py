import re
from typing import Set
import nh3

# Allowed tags as per CONTRACTS.md Section 2
ALLOWED_TAGS: Set[str] = {
    "p",
    "br",
    "h1",
    "h2",
    "h3",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "ul",
    "ol",
    "li",
    "blockquote",
    "hr",
    "a",
    "img",
    "span",
}

# Allowed attributes per tag
ALLOWED_ATTRIBUTES = {
    "p": {"style"},
    "h1": {"style"},
    "h2": {"style"},
    "h3": {"style"},
    "span": {"style"},
    "a": {"href", "target"},
    "img": {"src", "alt", "title", "width", "height"},
}

ALLOWED_URL_SCHEMES = {"http", "https"}

# Regex to extract valid text-align alignment values
TEXT_ALIGN_PATTERN = re.compile(
    r"text-align:\s*(left|center|right|justify)", re.IGNORECASE
)


def sanitize_html(raw_html: str) -> str:
    """
    Sanitizes user-submitted or PDF-generated HTML against Stored XSS.
    Strictly follows CONTRACTS.md Section 2 rules:
    - Enforces allowed tags and attributes.
    - Strips disallowed CSS from style attributes (allowing text-align only).
    - Enforces safe rel on links and safe image sources.
    """
    if not raw_html:
        return ""

    # Phase 1: nh3 base sanitization
    cleaned = nh3.clean(
        raw_html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_URL_SCHEMES,
        link_rel="noopener noreferrer",
    )

    # Phase 2: Post-processing to enforce strict style values (text-align only, stripping any other CSS)
    def clean_style_attr(match: re.Match) -> str:
        tag_name = match.group(1)
        style_content = match.group(2).strip()
        align_match = TEXT_ALIGN_PATTERN.search(style_content)
        if align_match:
            align_val = align_match.group(1).lower()
            return f'<{tag_name} style="text-align: {align_val};"'
        return f"<{tag_name}"

    # Match <(p|h1|h2|h3|span) ... style="..." ...>
    style_regex = re.compile(
        r"<(p|h1|h2|h3|span)[^>]*?\s+style=[\"']([^\"']*)[\"']", re.IGNORECASE
    )
    cleaned = style_regex.sub(clean_style_attr, cleaned)

    return cleaned
