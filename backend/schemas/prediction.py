from pydantic import BaseModel, Field


class PollutionPrediction(BaseModel):
    country: str
    city: str

    forecast_horizon_hours: int = Field(default=6, ge=1)

    current_pm25: float
    predicted_pm25: float

    change_percent: float

    risk_level: str

    risk_score: float = Field(ge=0, le=1)

    model_version: str