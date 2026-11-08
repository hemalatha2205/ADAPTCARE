"""
Demand Prediction Model for ADAPTCARE.
Uses RandomForestRegressor to predict patient demand per department,
considering day of week, time of day, month, and department patterns.
"""

import os
import logging
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved")
MODEL_PATH = os.path.join(MODEL_DIR, "demand_model.joblib")

# Department baselines (index → typical daily patient count)
DEPARTMENT_BASELINES = {
    0: 30,  # General Medicine — highest volume
    1: 22,  # Pediatrics
    2: 20,  # Orthopedics
    3: 18,  # Cardiology
    4: 16,  # Neurology
    5: 15,  # ENT
    6: 14,  # Ophthalmology
    7: 12,  # Dermatology — lowest volume
}


class DemandPredictor:
    """Predicts patient demand (count) per department using Random Forest."""

    FEATURES = [
        "department_encoded",
        "day_of_week",
        "hour_of_day",
        "month",
        "is_weekend",
    ]

    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.model_version = None

    def train(self, data: pd.DataFrame):
        """
        Train the demand prediction model.

        Args:
            data: DataFrame with columns matching FEATURES plus 'patient_count' target.

        Returns:
            dict with training metrics.
        """
        X = data[self.FEATURES]
        y = data["patient_count"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.model = RandomForestRegressor(
            n_estimators=150,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        self.is_loaded = True
        self.model_version = datetime.now().strftime("%Y%m%d_%H%M%S")

        metrics = {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
        }
        logger.info(f"Demand model trained — MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.4f}")
        return metrics

    def predict(self, features: dict) -> dict:
        """
        Predict patient demand for given features.

        Args:
            features: dict with keys matching FEATURES.

        Returns:
            dict with 'prediction' (count) and 'confidence'.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model not loaded")

        feature_values = np.array([[features[f] for f in self.FEATURES]])
        prediction = self.model.predict(feature_values)[0]

        # Confidence heuristic: Random Forest gives reasonable confidence for in-range inputs
        base_confidence = 0.82
        # Lower confidence for edge-case hours (very early/late)
        if features["hour_of_day"] < 8 or features["hour_of_day"] > 18:
            base_confidence -= 0.1
        confidence = max(0.5, base_confidence)

        return {
            "prediction": max(0.0, float(prediction)),
            "confidence": confidence,
        }

    def save_model(self):
        """Save trained model to disk."""
        if self.model is None:
            raise RuntimeError("No model to save")
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(
            {"model": self.model, "version": self.model_version},
            MODEL_PATH,
        )
        logger.info(f"Demand model saved to {MODEL_PATH}")

    def load_model(self):
        """Load a previously saved model from disk."""
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"No saved model at {MODEL_PATH}")
        data = joblib.load(MODEL_PATH)
        self.model = data["model"]
        self.model_version = data["version"]
        self.is_loaded = True
        logger.info(f"Demand model loaded (version {self.model_version})")

    def train_and_save(self) -> dict:
        """Generate training data, train model, and save it."""
        df = self.generate_training_data()
        metrics = self.train(df)
        self.save_model()
        return metrics

    @staticmethod
    def generate_training_data(n_samples: int = 3500) -> pd.DataFrame:
        """
        Generate synthetic but realistic demand data.

        Patterns modeled:
        - Department-specific baselines (General Medicine highest, Dermatology lowest)
        - Weekdays busier than weekends
        - Morning rush (9-12), afternoon moderate (13-16), taper off after
        - Seasonal variation: flu season (Nov-Feb) increases General Medicine & Pediatrics
        - Some random variation per sample
        """
        rng = np.random.RandomState(42)

        department_encoded = rng.randint(0, 8, size=n_samples)
        day_of_week = rng.randint(0, 7, size=n_samples)
        hour_of_day = rng.randint(8, 19, size=n_samples)
        month = rng.randint(1, 13, size=n_samples)
        is_weekend = (day_of_week >= 5).astype(int)

        # Department baseline
        dept_base = np.array([DEPARTMENT_BASELINES[d] for d in department_encoded], dtype=float)

        # Weekend reduction: ~40% less
        weekend_factor = np.where(is_weekend == 1, 0.6, 1.0)

        # Hour-of-day pattern (hourly fraction of daily volume)
        hour_multiplier = np.ones(n_samples)
        hour_multiplier = np.where((hour_of_day >= 9) & (hour_of_day <= 12), 1.3, hour_multiplier)   # morning rush
        hour_multiplier = np.where((hour_of_day >= 13) & (hour_of_day <= 16), 1.0, hour_multiplier)  # afternoon normal
        hour_multiplier = np.where(hour_of_day == 8, 0.7, hour_multiplier)                           # early start
        hour_multiplier = np.where(hour_of_day >= 17, 0.5, hour_multiplier)                          # winding down

        # Seasonal variation: flu season (Nov-Feb) boosts depts 0 (Gen Med) and 1 (Peds)
        seasonal_boost = np.ones(n_samples)
        flu_season = (month >= 11) | (month <= 2)
        seasonal_boost = np.where(
            flu_season & ((department_encoded == 0) | (department_encoded == 1)),
            1.25,
            seasonal_boost,
        )
        # Summer slight dip
        seasonal_boost = np.where((month >= 6) & (month <= 8), 0.9, seasonal_boost)

        # Gaussian noise
        noise = rng.normal(0, 2, size=n_samples)

        # Per-hour patient count (fraction of daily baseline)
        # Divide daily baseline by ~10 working hours to get per-hour count, then apply multipliers
        per_hour_base = dept_base / 10.0
        patient_count = per_hour_base * weekend_factor * hour_multiplier * seasonal_boost + noise

        # Floor at 0
        patient_count = np.maximum(patient_count, 0.0)

        df = pd.DataFrame({
            "department_encoded": department_encoded,
            "day_of_week": day_of_week,
            "hour_of_day": hour_of_day,
            "month": month,
            "is_weekend": is_weekend,
            "patient_count": np.round(patient_count, 1),
        })

        return df
