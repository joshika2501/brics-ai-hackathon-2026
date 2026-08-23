from pydantic import BaseModel


class GeminiAnalysis(BaseModel):
    summary: str

    likely_drivers: list[str]

    affected_area: str

    urgency: str

    recommended_actions: list[str]