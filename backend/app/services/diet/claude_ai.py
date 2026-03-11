"""Claude AI macronutrient lookup — uses claude-haiku-3-5."""

import json

import anthropic

from app.config import settings

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

PROMPT_TEMPLATE = """You are a nutritionist database. For the ingredient "{name}",
return ONLY a valid JSON object with these fields (values per 100g):

{{
  "name": "{name}",
  "kcal_per_100g": <number>,
  "proteins_g": <number>,
  "carbs_g": <number>,
  "fats_g": <number>,
  "unit": "g"
}}

Use standard nutritional reference values. Return ONLY the JSON, no extra text."""


async def lookup_macros(ingredient_name: str) -> dict:
    """Ask Claude Haiku for macronutrient estimates per 100g."""
    message = _client.messages.create(
        model="claude-haiku-3-5-20241022",
        max_tokens=256,
        messages=[
            {
                "role": "user",
                "content": PROMPT_TEMPLATE.format(name=ingredient_name),
            }
        ],
    )
    raw = message.content[0].text.strip()
    # Extract JSON even if wrapped in markdown code block
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())
