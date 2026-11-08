"""
ADAPTCARE - Model Training Script
Trains both Wait Time and Demand prediction models and saves them to disk.
"""

import os
import sys
import pandas as pd
from models.wait_time_model import WaitTimePredictor
from models.demand_model import DemandPredictor

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
WAIT_TIME_CSV = os.path.join(DATA_DIR, "wait_time_training_data.csv")
DEMAND_CSV = os.path.join(DATA_DIR, "demand_training_data.csv")


def train_wait_time_model():
    print("\n" + "=" * 60)
    print("  TRAINING WAIT TIME MODEL")
    print("=" * 60)

    predictor = WaitTimePredictor()

    if os.path.exists(WAIT_TIME_CSV):
        print(f"Loading existing training data from {WAIT_TIME_CSV}")
        df = pd.read_csv(WAIT_TIME_CSV)
    else:
        print("Generating synthetic training data...")
        df = WaitTimePredictor.generate_training_data()
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(WAIT_TIME_CSV, index=False)
        print(f"Training data saved to {WAIT_TIME_CSV}")

    print(f"Training samples: {len(df)}")
    print(f"Features: {WaitTimePredictor.FEATURES}")
    print(f"Target range: {df['wait_time'].min():.1f} - {df['wait_time'].max():.1f} minutes")
    print()

    metrics = predictor.train(df)
    predictor.save_model()

    print("\n  Results:")
    print(f"    MAE  : {metrics['mae']:.2f} minutes")
    print(f"    RMSE : {metrics['rmse']:.2f} minutes")
    print(f"    R2   : {metrics['r2']:.4f}")
    print(f"    Train: {metrics['train_samples']}  |  Test: {metrics['test_samples']}")

    print("\n  Sample Predictions:")
    test_cases = [
        {"queue_length": 2, "doctor_workload": 3, "appointment_type_encoded": 0, "emergency_count": 0, "hour_of_day": 10, "day_of_week": 1},
        {"queue_length": 10, "doctor_workload": 10, "appointment_type_encoded": 0, "emergency_count": 2, "hour_of_day": 11, "day_of_week": 2},
        {"queue_length": 18, "doctor_workload": 20, "appointment_type_encoded": 2, "emergency_count": 5, "hour_of_day": 13, "day_of_week": 0},
    ]
    labels = ["Low load", "Medium load", "High load"]
    for label, tc in zip(labels, test_cases):
        result = predictor.predict(tc)
        print(f"    {label:12s} -> {result['prediction']:6.1f} min  (confidence {result['confidence']:.2f})")

    return metrics


def train_demand_model():
    print("\n" + "=" * 60)
    print("  TRAINING DEMAND MODEL")
    print("=" * 60)

    predictor = DemandPredictor()

    if os.path.exists(DEMAND_CSV):
        print(f"Loading existing training data from {DEMAND_CSV}")
        df = pd.read_csv(DEMAND_CSV)
    else:
        print("Generating synthetic training data...")
        df = DemandPredictor.generate_training_data()
        os.makedirs(DATA_DIR, exist_ok=True)
        df.to_csv(DEMAND_CSV, index=False)
        print(f"Training data saved to {DEMAND_CSV}")

    print(f"Training samples: {len(df)}")
    print(f"Features: {DemandPredictor.FEATURES}")
    print(f"Target range: {df['patient_count'].min():.1f} - {df['patient_count'].max():.1f} patients/hour")
    print()

    metrics = predictor.train(df)
    predictor.save_model()

    print("\n  Results:")
    print(f"    MAE  : {metrics['mae']:.2f} patients")
    print(f"    RMSE : {metrics['rmse']:.2f} patients")
    print(f"    R2   : {metrics['r2']:.4f}")
    print(f"    Train: {metrics['train_samples']}  |  Test: {metrics['test_samples']}")

    print("\n  Sample Predictions:")
    test_cases = [
        {"department_encoded": 0, "day_of_week": 1, "hour_of_day": 10, "month": 1, "is_weekend": 0},
        {"department_encoded": 7, "day_of_week": 5, "hour_of_day": 15, "month": 7, "is_weekend": 1},
        {"department_encoded": 3, "day_of_week": 3, "hour_of_day": 11, "month": 4, "is_weekend": 0},
    ]
    labels = ["GenMed Tue 10am Jan", "Derm  Sat 3pm Jul ", "Cardio Thu 11am Apr"]
    for label, tc in zip(labels, test_cases):
        result = predictor.predict(tc)
        print(f"    {label} -> {result['prediction']:5.1f} patients  (confidence {result['confidence']:.2f})")

    return metrics


if __name__ == "__main__":
    print("=" * 60)
    print("  ADAPTCARE ML - Model Training Pipeline")
    print("=" * 60)

    wt_metrics = train_wait_time_model()
    dm_metrics = train_demand_model()

    print("\n" + "=" * 60)
    print("  ALL MODELS TRAINED SUCCESSFULLY")
    print("=" * 60)
    print(f"  Wait Time  - MAE: {wt_metrics['mae']:.2f} min, R2: {wt_metrics['r2']:.4f}")
    print(f"  Demand     - MAE: {dm_metrics['mae']:.2f} pts, R2: {dm_metrics['r2']:.4f}")
    print("=" * 60)
