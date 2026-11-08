"""
ADAPTCARE ML Service — FastAPI Application.
Provides wait time and demand predictions for the ADAPTCARE Healthcare Management System.
"""

import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging

from schemas import (
    WaitTimePredictionRequest, WaitTimePredictionResponse,
    DemandPredictionRequest, DemandPredictionResponse,
    HealthResponse, ModelInfoResponse,
)
from models.wait_time_model import WaitTimePredictor
from models.demand_model import DemandPredictor

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ADAPTCARE ML Service",
    description="Machine Learning predictions for the ADAPTCARE Healthcare Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8083",
        "http://localhost:5174",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8083",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Initialize predictors
# ---------------------------------------------------------------------------
wait_time_predictor = WaitTimePredictor()
demand_predictor = DemandPredictor()

# Try loading saved models
try:
    wait_time_predictor.load_model()
    logger.info("Wait time model loaded successfully")
except Exception as e:
    logger.warning(f"Wait time model not found, will use fallback: {e}")

try:
    demand_predictor.load_model()
    logger.info("Demand model loaded successfully")
except Exception as e:
    logger.warning(f"Demand model not found, will use fallback: {e}")

# ---------------------------------------------------------------------------
# Mapping
# ---------------------------------------------------------------------------
APPOINTMENT_TYPE_MAP = {
    "REGULAR": 0,
    "FOLLOW_UP": 1,
    "CONSULTATION": 2,
    "EMERGENCY": 3,
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="adaptcare-ml",
        models_loaded={
            "wait_time": wait_time_predictor.is_loaded,
            "demand": demand_predictor.is_loaded,
        },
    )


@app.post("/predict/wait-time", response_model=WaitTimePredictionResponse)
def predict_wait_time(request: WaitTimePredictionRequest):
    """Predict patient wait time based on current conditions."""
    type_encoded = APPOINTMENT_TYPE_MAP.get(request.appointment_type, 0)
    day = request.day_of_week if request.day_of_week is not None else datetime.now().weekday()

    if wait_time_predictor.is_loaded:
        try:
            result = wait_time_predictor.predict({
                "queue_length": request.queue_length,
                "doctor_workload": request.doctor_workload,
                "appointment_type_encoded": type_encoded,
                "emergency_count": request.emergency_count,
                "hour_of_day": request.hour_of_day,
                "day_of_week": day,
            })
            return WaitTimePredictionResponse(
                estimated_wait_minutes=round(result["prediction"], 1),
                confidence=round(result["confidence"], 2),
                source="ML_PREDICTION",
                model_version=wait_time_predictor.model_version,
            )
        except Exception as e:
            logger.error(f"ML prediction failed, using fallback: {e}")

    # Fallback calculation
    base = 10
    wait = base + (request.queue_length * 4) + (request.doctor_workload * 2) + (request.emergency_count * 5)
    if 10 <= request.hour_of_day <= 14:
        wait += 10
    return WaitTimePredictionResponse(
        estimated_wait_minutes=round(max(5, wait), 1),
        confidence=0.3,
        source="FALLBACK_ESTIMATE",
    )


@app.post("/predict/demand", response_model=DemandPredictionResponse)
def predict_demand(request: DemandPredictionRequest):
    """Predict patient demand for a department at a given time."""
    month = request.month if request.month is not None else datetime.now().month

    if demand_predictor.is_loaded:
        try:
            result = demand_predictor.predict({
                "department_encoded": request.department_id % 8,
                "day_of_week": request.day_of_week,
                "hour_of_day": request.hour_of_day,
                "month": month,
                "is_weekend": 1 if request.day_of_week >= 5 else 0,
            })
            return DemandPredictionResponse(
                predicted_count=round(result["prediction"], 1),
                confidence=round(result["confidence"], 2),
                source="ML_PREDICTION",
                model_version=demand_predictor.model_version,
            )
        except Exception as e:
            logger.error(f"ML prediction failed, using fallback: {e}")

    # Fallback
    base = 15
    if request.day_of_week >= 5:
        base = 8
    if 9 <= request.hour_of_day <= 12:
        base += 5
    return DemandPredictionResponse(
        predicted_count=float(base),
        confidence=0.3,
        source="FALLBACK_ESTIMATE",
    )


@app.post("/train/wait-time")
def train_wait_time():
    """Trigger wait time model training."""
    try:
        metrics = wait_time_predictor.train_and_save()
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train/demand")
def train_demand():
    """Trigger demand model training."""
    try:
        metrics = demand_predictor.train_and_save()
        return {"status": "success", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/info", response_model=ModelInfoResponse)
def model_info():
    """Get information about loaded models."""
    return ModelInfoResponse(
        wait_time_model={
            "loaded": wait_time_predictor.is_loaded,
            "version": wait_time_predictor.model_version,
            "type": "GradientBoostingRegressor",
        },
        demand_model={
            "loaded": demand_predictor.is_loaded,
            "version": demand_predictor.model_version,
            "type": "RandomForestRegressor",
        },
    )
