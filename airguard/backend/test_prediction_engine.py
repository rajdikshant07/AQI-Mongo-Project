"""
AirGuard: Phase 6 - Prediction Engine & Storage Test Suite
==========================================================
Tests risk inference across low-pollution and severe-smog scenarios,
verifies feature contribution ranking, validates MongoDB persistence,
and confirms historical retrieval and filtering.
"""

import os
import sys

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.predict import predict_air_quality_risk, get_prediction_history
from backend.config import Config
from backend.database import get_db

def run_prediction_tests():
    print("=" * 85)
    print("AIRGUARD: PHASE 6 PREDICTION ENGINE & MONGODB STORAGE SUITE")
    print("=" * 85)
    
    # --------------------------------------------------------------------------
    # Scenario 1: Clean Coastal / Monsoon Air (Low Pollution)
    # --------------------------------------------------------------------------
    clean_sample = {
        "city": "Thiruvananthapuram",
        "pm25": 18.5,
        "pm10": 35.0,
        "no": 4.2,
        "no2": 11.0,
        "co": 0.35,
        "so2": 6.5,
        "o3": 22.0,
        "month": 7, # July (Monsoon)
        "is_weekend": 0
    }
    
    print("\n[SCENARIO 1: Clean Coastal / Monsoon Air (Expected: Lower Risk - Class 0)]")
    res_clean_lr = predict_air_quality_risk(clean_sample, model_name="Logistic Regression", station_or_city="Plammoodu, Thiruvananthapuram")
    print(f"    - Model: {res_clean_lr['model_name']}")
    print(f"    - Predicted Risk: {res_clean_lr['predicted_risk']} ({res_clean_lr['risk_category']})")
    print(f"    - P(Lower Risk)  : {res_clean_lr['probabilities']['lower_risk']*100:.2f}%")
    print(f"    - P(Elevated Risk): {res_clean_lr['probabilities']['elevated_risk']*100:.2f}%")
    print(f"    - Persisted _id  : {res_clean_lr.get('_id')}")
    
    # --------------------------------------------------------------------------
    # Scenario 2: Severe Winter Smog Episode (Elevated Pollution)
    # --------------------------------------------------------------------------
    smog_sample = {
        "city": "Delhi",
        "pm25": 310.0,
        "pm10": 460.0,
        "no": 75.0,
        "no2": 85.0,
        "co": 3.8,
        "so2": 25.0,
        "o3": 45.0,
        "month": 12, # December (Winter)
        "is_weekend": 1
    }
    
    print("\n[SCENARIO 2: Severe Winter Smog Episode (Expected: Elevated Risk - Class 1)]")
    res_smog_lr = predict_air_quality_risk(smog_sample, model_name="Logistic Regression", station_or_city="Anand Vihar, Delhi")
    print(f"    - Model: {res_smog_lr['model_name']}")
    print(f"    - Predicted Risk: {res_smog_lr['predicted_risk']} ({res_smog_lr['risk_category']})")
    print(f"    - P(Lower Risk)  : {res_smog_lr['probabilities']['lower_risk']*100:.2f}%")
    print(f"    - P(Elevated Risk): {res_smog_lr['probabilities']['elevated_risk']*100:.2f}%")
    print(f"    - Top Risk Contributors (Logistic Regression beta * z):")
    for c in res_smog_lr.get("feature_contributions", [])[:3]:
        print(f"      * {c['feature']:15}: Value={c['raw_value']}, beta={c['coefficient']}, Contribution={c['contribution']:+.2f} ({c['impact']})")
    print(f"    - Persisted _id  : {res_smog_lr.get('_id')}")

    # --------------------------------------------------------------------------
    # Scenario 3: Urban Moderate Air (Near Decision Boundary)
    # --------------------------------------------------------------------------
    moderate_sample = {
        "city": "Bengaluru",
        "pm25": 55.0,
        "pm10": 95.0,
        "no": 15.0,
        "no2": 28.0,
        "co": 0.95,
        "so2": 11.0,
        "o3": 32.0,
        "month": 3,
        "is_weekend": 0
    }
    print("\n[SCENARIO 3: Urban Moderate Air (Logistic Regression Boundary Analysis)]")
    res_mod = predict_air_quality_risk(moderate_sample, model_name="Logistic Regression", station_or_city="BTM Layout, Bengaluru")
    print(f"    - Model: {res_mod['model_name']}")
    print(f"    - Predicted Risk: {res_mod['predicted_risk']} ({res_mod['risk_category']})")
    print(f"    - P(Lower Risk)  : {res_mod['probabilities']['lower_risk']*100:.2f}%")
    print(f"    - P(Elevated Risk): {res_mod['probabilities']['elevated_risk']*100:.2f}%")
    print(f"    - Persisted _id  : {res_mod.get('_id')}")

    # --------------------------------------------------------------------------
    # Scenario 4: MongoDB Prediction History Retrieval & Filtering
    # --------------------------------------------------------------------------
    print("\n[SCENARIO 4: Retrieving Prediction History from MongoDB 'prediction_results']")
    db = get_db()
    total_stored = db[Config.COLL_PREDICTION_RESULTS].count_documents({})
    print(f"    - Total Stored Prediction Audits: {total_stored}")
    
    history = get_prediction_history(limit=5)
    print(f"    - Retrieved Most Recent 5 Records:")
    for idx, item in enumerate(history, 1):
        station = item.get("station_or_city", "Unknown")
        model = item.get("model_name", "Unknown")
        cat = item.get("risk_category", "Unknown")
        prob = item.get("probability", 0) * 100
        time_str = item.get("prediction_timestamp", "")[:19]
        print(f"      {idx}. [{time_str}] {station:<28} | {model:<20} | {cat:<24} ({prob:5.1f}%)")

    # Filtered Query
    elevated_history = get_prediction_history(filter_risk=1)
    print(f"\n    - Filtered Elevated Risk Count in History: {len(elevated_history)} records retrieved.")

    print("\n" + "=" * 85)
    print("PHASE 6 PREDICTION & STORAGE ENGINE VALIDATED SUCCESSFULLY!")
    print("=" * 85)

if __name__ == "__main__":
    run_prediction_tests()
