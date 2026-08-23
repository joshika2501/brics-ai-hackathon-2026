from datetime import datetime
from pydantic import BaseModel, Field


class Location(BaseModel):
    country: str
    city: str
    latitude: float
    longitude: float


class AirQuality(BaseModel):
    pm25: float | None = Field(default=None, ge=0)
    pm10: float | None = Field(default=None, ge=0)
    no2: float | None = Field(default=None, ge=0)


class Weather(BaseModel):
    temperature: float | None = None
    humidity: float | None = Field(default=None, ge=0, le=100)
    wind_speed: float | None = Field(default=None, ge=0)
    wind_direction: float | None = Field(default=None, ge=0, le=360)
    pressure: float | None = Field(default=None, ge=0)
    precipitation: float | None = Field(default=None, ge=0)


class EnvironmentalObservation(BaseModel):
    location: Location
    timestamp: datetime
    air_quality: AirQuality
    weather: Weather