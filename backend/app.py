from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from backend.services.environment import get_current_environment
from backend.services.locations import get_location
from backend.services.prediction import get_prediction, CITY_COORDINATES
from backend.services.live_features import get_live_feature_row
from backend.services.simulation import simulate_scenario
from backend.risk_engine import generate_risk_assessment
from backend.decision_engine import build_decision
from backend.services.citizen_reports import create_report, get_report, get_reports
from backend.services.hotspot_fusion import fuse_hotspots
from backend.services.authority_alerts import generate_authority_alerts
from backend.services.citizen_vision import analyze_environmental_photo
from backend.services.satellite_intelligence import get_satellite_evidence
from backend.services.industry_environment import get_industry_environment

app = FastAPI(
    title="BRICS Environmental Intelligence",
    version="1.0.0",
)

class StripAPIPrefixMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.scope["path"].startswith("/api"):
            request.scope["path"] = request.scope["path"][4:] or "/"
            request.scope["raw_path"] = request.scope["path"].encode("utf-8")

        return await call_next(request)


app.add_middleware(StripAPIPrefixMiddleware)
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

class CitizenReportRequest(BaseModel):
    city: str = Field(...)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    event_type: str = Field(default="UNKNOWN")
    description: str = Field(default="")
    pm25: float | None = Field(default=None, ge=0)
    pm10: float | None = Field(default=None, ge=0)
    sensor_source: str | None = None
    photo_reference: str | None = None


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

@app.post("/citizen/report")
def citizen_report(request: CitizenReportRequest):
    try:
        report = create_report(
            city=request.city,
            latitude=request.latitude,
            longitude=request.longitude,
            event_type=request.event_type,
            description=request.description,
            pm25=request.pm25,
            pm10=request.pm10,
            sensor_source=request.sensor_source,
            photo_reference=request.photo_reference,
        )

        return {
            "status": "success",
            "report": report,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@app.get("/citizen/reports")
def citizen_reports(city: str | None = None):
    reports = get_reports(city=city)

    return {
        "count": len(reports),
        "reports": reports,
    }


@app.get("/citizen/report/{report_id}")
def citizen_report_by_id(report_id: str):
    report = get_report(report_id)

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Citizen report not found.",
        )

    return {
        "status": "success",
        "report": report,
    }

@app.get("/hotspots/{city}")
def hotspot_intelligence(city: str):
    try:
        prediction = get_prediction(city)
        reports = get_reports(city=city)

        city_locations = {
            "delhi": (28.6139, 77.2090),
            "johannesburg": (-26.2041, 28.0473),
            "sao paulo": (-23.5505, -46.6333),
        }

        location = city_locations.get(
            city.strip().lower()
        )

        atmospheric_evidence = None

        if location:
            latitude, longitude = location

            atmospheric_evidence = get_satellite_evidence(
                latitude=latitude,
                longitude=longitude,
                city=city,
            )

        fused = fuse_hotspots(
            prediction=prediction,
            citizen_reports=reports,
            atmospheric_evidence=atmospheric_evidence,
        )
        return {
            "status": "success",
            "data": fused,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Hotspot fusion failed: {str(exc)}",
        )

@app.get("/satellite/{city}")
def satellite_intelligence(city: str):
    city_key = city.strip().lower()

    locations = {
        "delhi": (28.6139, 77.2090),
        "johannesburg": (-26.2041, 28.0473),
        "sao paulo": (-23.5505, -46.6333),
    }

    if city_key not in locations:
        raise HTTPException(
            status_code=404,
            detail=f"Satellite location not configured for {city}",
        )

    latitude, longitude = locations[city_key]

    return {
        "status": "success",
        "data": get_satellite_evidence(
            latitude=latitude,
            longitude=longitude,
            city=city,
        ),
    }

@app.get("/industry/environment")
async def industry_environment(city: str, lat: float, lng: float, industry_name: str = ""):
    return get_industry_environment(city, lat, lng, industry_name)


@app.get("/alerts/{city}")
def authority_alerts(city: str):
    try:
        prediction = get_prediction(city)
        reports = get_reports(city=city)

        city_locations = {
            "delhi": (28.6139, 77.2090),
            "johannesburg": (-26.2041, 28.0473),
            "sao paulo": (-23.5505, -46.6333),
        }

        location = city_locations.get(city.strip().lower())
        atmospheric_evidence = None

        if location:
            latitude, longitude = location

            atmospheric_evidence = get_satellite_evidence(
                latitude=latitude,
                longitude=longitude,
                city=city,
            )

        fused = fuse_hotspots(
            prediction=prediction,
            citizen_reports=reports,
            atmospheric_evidence=atmospheric_evidence,
        )

        alerts = generate_authority_alerts(
            fusion_result=fused,
        )

        return {
            "status": "success",
            "data": alerts,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Authority alert generation failed: {str(exc)}",
        )

@app.post("/citizen/report-with-photo")
async def citizen_report_with_photo(
    city: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    event_type: str = Form(default="UNKNOWN"),
    description: str = Form(default=""),
    pm25: float | None = Form(default=None),
    pm10: float | None = Form(default=None),
    sensor_source: str | None = Form(default=None),
    photo_reference: str | None = Form(default=None),
    file: UploadFile = File(...),
):
    try:
        if not city.strip():
            raise HTTPException(
                status_code=400,
                detail="City is required.",
            )

        if not file.content_type:
            raise HTTPException(
                status_code=400,
                detail="Image content type is required.",
            )

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Unsupported image type. Use JPEG, PNG, or WebP.",
            )

        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty.",
            )

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image must be smaller than 10 MB.",
            )

        # Analyze the citizen photo with Gemini Vision.
        ai_result = analyze_environmental_photo(
            image_bytes=image_bytes,
            mime_type=file.content_type,
            description=description,
        )

        # Extract only the structured visual analysis for the report.
        visual_analysis = ai_result.get(
            "visual_analysis",
            {},
        )

        ai_report_evidence = {
            "status": ai_result.get("status"),
            "model": ai_result.get("model"),
            "event_type": visual_analysis.get("event_type", "UNKNOWN"),
            "confidence": visual_analysis.get("confidence", 0.0),
            "visual_evidence": visual_analysis.get(
                "visual_evidence",
                [],
            ),
            "scene_summary": visual_analysis.get(
                "scene_summary",
                "",
            ),
            "potential_environmental_signal": visual_analysis.get(
                "potential_environmental_signal",
                "",
            ),
        }

        # Preserve the citizen's original event classification.
        report = create_report(
            city=city,
            latitude=latitude,
            longitude=longitude,
            event_type=event_type,
            description=description,
            pm25=pm25,
            pm10=pm10,
            sensor_source=sensor_source,
            photo_reference=photo_reference or file.filename,
            ai_analysis=ai_report_evidence,
        )

        return {
            "status": "success",
            "report": report,
            "vision": {
                "status": ai_result.get("status"),
                "model": ai_result.get("model"),
                "event_type": ai_report_evidence["event_type"],
                "confidence": ai_report_evidence["confidence"],
            },
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Citizen report creation failed: {str(exc)}",
        )
@app.post("/citizen/analyze-photo")
async def analyze_citizen_photo(
    file: UploadFile = File(...),
    description: str = Form(default=""),
):
    try:
        if not file.content_type:
            raise HTTPException(
                status_code=400,
                detail="Image content type is required.",
            )

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Unsupported image type. "
                    "Use JPEG, PNG, or WebP."
                ),
            )

        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty.",
            )

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image must be smaller than 10 MB.",
            )

        analysis = analyze_environmental_photo(
            image_bytes=image_bytes,
            mime_type=file.content_type,
            description=description,
        )

        return {
            "status": "success",
            "filename": file.filename,
            "content_type": file.content_type,
            "analysis": analysis,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Citizen photo analysis failed: {str(exc)}",
        )

