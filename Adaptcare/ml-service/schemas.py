"""
Pydantic schemas for the ADAPTCARE ML Service API.
"""

from pydantic import BaseModel, Field
from typing import Optional


class WaitTimePredictionRequest(BaseModel):
    """Request schema for wait time prediction."""
    queue_length: int = Field(ge=0, le=50, description="Number of patients in queue")
    doctor_workload: int = Field(ge=0, le=50, description="Current doctor workload (active patients)")
    appointment_type: str = Field(description="REGULAR, FOLLOW_UP, CONSULTATION, EMERGENCY")
    emergency_count: int = Field(ge=0, le=20, description="Number of emergency cases currently being handled")
    hour_of_day: int = Field(ge=0, le=23, description="Current hour (0-23)")
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")


class WaitTimePredictionResponse(BaseModel):
    """Response schema for wait time prediction."""
    estimated_wait_minutes: float
    confidence: float
    source: str  # "ML_PREDICTION" or "FALLBACK_ESTIMATE"
    model_version: Optional[str] = None


class DemandPredictionRequest(BaseModel):
    """Request schema for demand prediction."""
    department_id: int = Field(ge=0, description="Department identifier")
    day_of_week: int = Field(ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    hour_of_day: int = Field(ge=0, le=23, description="Hour of day (0-23)")
    month: Optional[int] = Field(default=None, ge=1, le=12, description="Month (1-12)")


class DemandPredictionResponse(BaseModel):
    """Response schema for demand prediction."""
    predicted_count: float
    confidence: float
    source: str  # "ML_PREDICTION" or "FALLBACK_ESTIMATE"
    model_version: Optional[str] = None


class HealthResponse(BaseModel):
    """Response schema for health check."""
    status: str
    service: str
    models_loaded: dict


class ModelInfoResponse(BaseModel):
    """Response schema for model info."""
    wait_time_model: dict
    demand_model: dict
