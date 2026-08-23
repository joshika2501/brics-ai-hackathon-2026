from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.services.environment import get_current_environment
from backend.services.locations import get_location
from backend.services.prediction import get_prediction


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

