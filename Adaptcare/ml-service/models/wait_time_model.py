"""
Wait Time Prediction Model for ADAPTCARE.
Uses GradientBoostingRegressor to predict patient wait times
based on queue length, doctor workload, appointment type, and other factors.
"""

import os
import logging
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved")
MODEL_PATH = os.path.join(MODEL_DIR, "wait_time_model.joblib")


class WaitTimePredictor:
    """Predicts patient wait times using a Gradient Boosting model."""

    FEATURES = [
        "queue_length",
        "doctor_workload",
        "appointment_type_encoded",
        "emergency_count",
        "hour_of_day",
        "day_of_week",
    ]

    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.model_version = None

    def train(self, data: pd.DataFrame):
        """
        Train the wait time prediction model.

        Args:
            data: DataFrame with columns matching FEATURES plus 'wait_time' target.

        Returns:
            dict with training metrics.
        """
        X = data[self.FEATURES]
        y = data["wait_time"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=3,
            subsample=0.8,
            random_state=42,
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
        logger.info(f"Wait time model trained — MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.4f}")
        return metrics

    def predict(self, features: dict) -> dict:
        """
        Predict wait time for given features.

        Args:
            features: dict with keys matching FEATURES.

        Returns:
            dict with 'prediction' (minutes) and 'confidence'.
        """
        if not self.is_loaded or self.model is None:
            raise RuntimeError("Model not loaded")

        feature_values = np.array([[features[f] for f in self.FEATURES]])
        prediction = self.model.predict(feature_values)[0]

        # Confidence based on how "normal" the input looks
        # Higher confidence for typical ranges, lower for edge-case inputs
        queue_norm = min(features["queue_length"] / 20.0, 1.0)
        workload_norm = min(features["doctor_workload"] / 25.0, 1.0)
        base_confidence = 0.85
        edge_penalty = 0.0
        if queue_norm > 0.9 or workload_norm > 0.9:
            edge_penalty = 0.15
        confidence = max(0.5, base_confidence - edge_penalty)

        return {
            "prediction": max(5.0, float(prediction)),
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
        logger.info(f"Wait time model saved to {MODEL_PATH}")

    def load_model(self):
        """Load a previously saved model from disk."""
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"No saved model at {MODEL_PATH}")
        data = joblib.load(MODEL_PATH)
        self.model = data["model"]
        self.model_version = data["version"]
        self.is_loaded = True
        logger.info(f"Wait time model loaded (version {self.model_version})")

    def train_and_save(self) -> dict:
        """Generate training data, train model, and save it."""
        df = self.generate_training_data()
        metrics = self.train(df)
        self.save_model()
        return metrics

    @staticmethod
    def generate_training_data(n_samples: int = 2500) -> pd.DataFrame:
        """
        Generate synthetic but realistic training data for wait time prediction.

        The formula models real-world patterns:
        - More people in queue → longer wait
        - Higher doctor workload → longer wait
        - More emergencies → longer wait (they take priority)
        - Busy hours (10-14) → longer wait
        - Weekends slightly shorter
        """
        rng = np.random.RandomState(42)

        queue_length = rng.randint(0, 21, size=n_samples)
        doctor_workload = rng.randint(0, 26, size=n_samples)
        appointment_type_encoded = rng.choice([0, 1, 2, 3], size=n_samples, p=[0.4, 0.25, 0.2, 0.15])
        emergency_count = rng.randint(0, 11, size=n_samples)
        hour_of_day = rng.randint(8, 19, size=n_samples)
        day_of_week = rng.randint(0, 7, size=n_samples)

        # --- Wait time formula ---
        base_time = 10.0

        # Queue contribution: each person adds 3-5 minutes (varies with noise)
        queue_factor = queue_length * (3.0 + rng.uniform(0, 2, size=n_samples))

        # Workload contribution: each active patient on doctor adds ~2 min
        workload_factor = doctor_workload * 2.0

        # Emergency contribution: each emergency adds ~5 min to non-emergency waits
        emergency_factor = emergency_count * 5.0

        # Appointment type adjustment
        type_adjustment = np.where(appointment_type_encoded == 3, -15.0,  # EMERGENCY → seen faster
                          np.where(appointment_type_encoded == 2, 5.0,    # CONSULTATION → longer
                          np.where(appointment_type_encoded == 1, -3.0,   # FOLLOW_UP → slightly faster
                          0.0)))                                          # REGULAR → baseline

        # Time-of-day factor: busy hours 10-14 add extra wait
        time_factor = np.where((hour_of_day >= 10) & (hour_of_day <= 14), 10.0, 0.0)

        # Weekend factor: weekends slightly less busy
        weekend_factor = np.where(day_of_week >= 5, -5.0, 0.0)

        # Gaussian noise
        noise = rng.normal(0, 3, size=n_samples)

        wait_time = (
            base_time
            + queue_factor
            + workload_factor
            + emergency_factor
            + type_adjustment
            + time_factor
            + weekend_factor
            + noise
        )

        # Floor at 5 minutes (minimum realistic wait)
        wait_time = np.maximum(wait_time, 5.0)

        df = pd.DataFrame({
            "queue_length": queue_length,
            "doctor_workload": doctor_workload,
            "appointment_type_encoded": appointment_type_encoded,
            "emergency_count": emergency_count,
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "wait_time": np.round(wait_time, 1),
        })

        return df
