"""
AirGuard: Phase 6 - Real-time Risk Prediction & MongoDB Result Storage Engine
=============================================================================
Loads serialized models and scaler, standardizes environmental input vectors,
dynamically computes engineered atmospheric ratios, generates calibrated risk
probabilities, and persists historical predictions in MongoDB 'prediction_results'.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from pymongo import DESCENDING

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config
from backend.database import get_db

MODELS_DIR = os.path.join(Config.BASE_DIR, "models")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

# Master feature ordering (Must strictly match the 17 features from Phase 5)
FEATURE_COLUMNS = [
    "pm25", "pm10", "no", "no2", "nox", "nh3", "co", "so2", "o3",
    "benzene", "toluene", "pm_ratio", "nitrogen_ratio", "combustion_index",
    "month_sin", "month_cos", "is_weekend"
]

# Model registry cache
_MODELS_CACHE = {}
_SCALER = None


def load_model(model_name="Logistic Regression"):
    """Loads and caches the Logistic Regression model and scaler."""
    global _MODELS_CACHE, _SCALER
    
    if _SCALER is None:
        if not os.path.exists(SCALER_PATH):
            raise FileNotFoundError(f"Scaler not found at {SCALER_PATH}. Run train_models.py first.")
        _SCALER = joblib.load(SCALER_PATH)
        
    model_path = os.path.join(MODELS_DIR, "logistic_model.pkl")
    if not os.path.exists(model_path):
        model_path = os.path.join(MODELS_DIR, "logistic_regression.pkl")
        
    if "Logistic Regression" not in _MODELS_CACHE:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Logistic Regression model not found at {model_path}.")
        _MODELS_CACHE["Logistic Regression"] = joblib.load(model_path)
        
    return _MODELS_CACHE["Logistic Regression"], _SCALER


def build_input_vector(raw_inputs):
    """
    Transforms raw user inputs into the exact standardized 17-dimensional vector:
    Dynamically computes pm_ratio, nitrogen_ratio, combustion_index, and cyclic month features.
    """
    eps = 1e-4
    pm25 = float(raw_inputs.get("pm25", 50.0))
    pm10 = float(raw_inputs.get("pm10", 90.0))
    no = float(raw_inputs.get("no", 15.0))
    no2 = float(raw_inputs.get("no2", 25.0))
    nox = float(raw_inputs.get("nox", no + no2))
    nh3 = float(raw_inputs.get("nh3", 20.0))
    co = float(raw_inputs.get("co", 1.0))
    so2 = float(raw_inputs.get("so2", 12.0))
    o3 = float(raw_inputs.get("o3", 30.0))
    benzene = float(raw_inputs.get("benzene", 2.0))
    toluene = float(raw_inputs.get("toluene", 5.0))
    
    # Temporal inputs
    month = int(raw_inputs.get("month", datetime.utcnow().month))
    is_weekend = int(raw_inputs.get("is_weekend", 0))
    
    # Compute atmospheric domain ratios
    pm_ratio = float(np.clip(pm25 / (pm10 + eps), 0.0, 1.5))
    nitrogen_ratio = float(np.clip(no2 / (no + no2 + eps), 0.0, 1.0))
    combustion_index = float(co * no2)
    month_sin = float(np.sin(2 * np.pi * month / 12.0))
    month_cos = float(np.cos(2 * np.pi * month / 12.0))
    
    feature_dict = {
        "pm25": pm25, "pm10": pm10, "no": no, "no2": no2, "nox": nox, "nh3": nh3,
        "co": co, "so2": so2, "o3": o3, "benzene": benzene, "toluene": toluene,
        "pm_ratio": pm_ratio, "nitrogen_ratio": nitrogen_ratio,
        "combustion_index": combustion_index,
        "month_sin": month_sin, "month_cos": month_cos,
        "is_weekend": is_weekend
    }
    
    # Assemble row matching FEATURE_COLUMNS order
    row_vector = [feature_dict[col] for col in FEATURE_COLUMNS]
    df_vector = pd.DataFrame([row_vector], columns=FEATURE_COLUMNS)
    return df_vector, feature_dict


def predict_air_quality_risk(raw_inputs, model_name="Logistic Regression", station_or_city=None, save_to_db=True):
    """
    Generates class prediction, probability, feature contributions, and stores result in MongoDB.
    """
    model, scaler = load_model(model_name)
    X_raw, feature_dict = build_input_vector(raw_inputs)
    
    # Standardize vector using pre-fitted scaler (Zero Leakage)
    X_scaled = scaler.transform(X_raw)
    
    # Predict discrete class
    pred_class = int(model.predict(X_scaled)[0])
    
    # Predict continuous probabilities
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_scaled)[0]
        prob_lower = round(float(probs[0]), 4)
        prob_elevated = round(float(probs[1]), 4)
    elif hasattr(model, "decision_function"):
        df_score = float(model.decision_function(X_scaled)[0])
        prob_elevated = round(float(1 / (1 + np.exp(-df_score))), 4)
        prob_lower = round(float(1 - prob_elevated), 4)
    else:
        prob_elevated = float(pred_class)
        prob_lower = float(1 - pred_class)
        
    risk_label = "Elevated Pollution Risk" if pred_class == 1 else "Lower Pollution Risk"
    
    # Feature contributions for Logistic Regression (beta_j * z_j)
    contributions = []
    if model_name == "Logistic Regression":
        coefs = model.coef_[0]
        intercept = float(model.intercept_[0])
        scaled_vals = X_scaled[0]
        for col_name, beta, z_val in zip(FEATURE_COLUMNS, coefs, scaled_vals):
            effect = float(beta * z_val)
            contributions.append({
                "feature": col_name,
                "raw_value": feature_dict[col_name],
                "scaled_value": round(float(z_val), 3),
                "coefficient": round(float(beta), 4),
                "contribution": round(effect, 4),
                "impact": "Increases Risk" if effect > 0 else "Decreases Risk"
            })
        contributions = sorted(contributions, key=lambda x: abs(x["contribution"]), reverse=True)

    station_name = station_or_city or raw_inputs.get("city", "Custom Station / Location")
    timestamp = datetime.utcnow()
    
    result_doc = {
        "station_or_city": station_name,
        "input_features": {
            "pm25": feature_dict["pm25"],
            "pm10": feature_dict["pm10"],
            "no2": feature_dict["no2"],
            "so2": feature_dict["so2"],
            "co": feature_dict["co"],
            "o3": feature_dict["o3"],
            "derived_pm_ratio": round(feature_dict["pm_ratio"], 3),
            "derived_combustion_index": round(feature_dict["combustion_index"], 2)
        },
        "all_features": feature_dict,
        "predicted_risk": pred_class,
        "risk_category": risk_label,
        "probability": prob_elevated,
        "probabilities": {
            "lower_risk": prob_lower,
            "elevated_risk": prob_elevated
        },
        "model_name": model_name,
        "model_version": "1.0",
        "feature_contributions": contributions[:5] if contributions else [],
        "prediction_timestamp": timestamp
    }
    
    # Persist in MongoDB
    if save_to_db:
        db = get_db()
        coll = db[Config.COLL_PREDICTION_RESULTS]
        res = coll.insert_one(result_doc.copy())
        result_doc["_id"] = str(res.inserted_id)
        
    return result_doc


def get_prediction_history(limit=50, filter_risk=None, model_name=None):
    """Retrieves chronological prediction history from MongoDB 'prediction_results'."""
    db = get_db()
    coll = db[Config.COLL_PREDICTION_RESULTS]
    
    query = {}
    if filter_risk is not None:
        query["predicted_risk"] = int(filter_risk)
    if model_name:
        query["model_name"] = model_name
        
    cursor = coll.find(query).sort("prediction_timestamp", DESCENDING).limit(limit)
    
    history = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("prediction_timestamp"), datetime):
            doc["prediction_timestamp"] = doc["prediction_timestamp"].isoformat()
        history.append(doc)
        
    return history
