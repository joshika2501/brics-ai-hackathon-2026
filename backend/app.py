from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from backend.services.environment import get_current_environment
from backend.services.locations import get_location
from backend.services.prediction import get_prediction, CITY_COORDINATES
from backend.services.live_features import get_live_feature_row
from backend.services.simulation import simulate_scenario
from backend.risk_engine import generate_risk_assessment
from backend.decision_engine import build_decision


app = FastAPI(
    title="BRICS Environmental Intelligence",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:6380",
        "http://127.0.0.1:3000",
        "https://brics-hackathon-2026.web.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "running",
        "project": "BRICS Environmental Intelligence",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.get("/environment/current")
def current_environment(
    country: str,
    city: str,
):
    try:
        location = get_location(
            country=country,
            city=city,
        )

        observation = get_current_environment(
            country=country,
            city=city,
            latitude=location["latitude"],
            longitude=location["longitude"],
        )

        return {
            "data": observation.model_dump()
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )



class SimulationRequest(BaseModel):
    city: str = Field(..., description="Supported city")
    changes: dict[str, float] = Field(
        ...,
        description="Feature values to change for the what-if scenario"
    )


@app.post("/simulate")
def simulate(request: SimulationRequest):
    city = request.city.strip()

    if city not in CITY_COORDINATES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": f"Unsupported city: {city}",
                "supported_cities": list(CITY_COORDINATES.keys()),
            },
        )

    try:
        latitude = CITY_COORDINATES[city]["latitude"]
        longitude = CITY_COORDINATES[city]["longitude"]

        live_data = get_live_feature_row(
            latitude=latitude,
            longitude=longitude,
        )

        baseline_features = live_data["features"]

        simulation = simulate_scenario(
            city=city,
            baseline_features=baseline_features,
            changes=request.changes,
        )

        current_pm25 = float(live_data["current_pm25"])

        baseline_risk = generate_risk_assessment(
            current_pm25=current_pm25,
            predicted_pm25=simulation["baseline_prediction"],
        )

        scenario_risk = generate_risk_assessment(
            current_pm25=current_pm25,
            predicted_pm25=simulation["scenario_prediction"],
        )

        baseline_decision = build_decision(
            risk_level=baseline_risk["risk_level"],
            trend_direction=baseline_risk["trend"]["direction"],
            percentage_change=baseline_risk["trend"]["percentage_change"],
        )

        scenario_decision = build_decision(
            risk_level=scenario_risk["risk_level"],
            trend_direction=scenario_risk["trend"]["direction"],
            percentage_change=scenario_risk["trend"]["percentage_change"],
        )

        simulation["baseline"] = {
            "pm25_prediction": baseline_risk["predicted_pm25"],
            "risk_level": baseline_risk["risk_level"],
            "trend": baseline_risk["trend"],
            "priority": baseline_decision["priority"],
        }

        simulation["scenario"] = {
            "pm25_prediction": scenario_risk["predicted_pm25"],
            "risk_level": scenario_risk["risk_level"],
            "trend": scenario_risk["trend"],
            "priority": scenario_decision["priority"],
        }

        simulation["impact"] = {
            "risk_changed": (
                baseline_risk["risk_level"]
                != scenario_risk["risk_level"]
            ),
            "priority_changed": (
                baseline_decision["priority"]
                != scenario_decision["priority"]
            ),
            "baseline_risk": baseline_risk["risk_level"],
            "scenario_risk": scenario_risk["risk_level"],
            "baseline_priority": baseline_decision["priority"],
            "scenario_priority": scenario_decision["priority"],
        }

        simulation["data_source"] = live_data.get(
            "data_source",
            "Live environmental data",
        )

        return simulation

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

@app.get("/predict/{city}")
def predict(city: str):

    try:
        return get_prediction(city)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "error": str(exc),
                "supported_cities": [
                    "Delhi",
                    "Johannesburg",
                    "Sao Paulo",
                ],
            },
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

