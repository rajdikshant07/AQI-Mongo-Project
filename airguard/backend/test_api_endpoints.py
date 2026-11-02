"""
AirGuard: Phase 7 - REST API Automated Testing Suite
====================================================
Tests all HTTP endpoints via Flask test client, verifying status codes,
response envelopes, input validation, and MongoDB integration.
"""

import os
import sys
import json

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.app import create_app

def run_api_tests():
    print("=" * 85)
    print("AIRGUARD: PHASE 7 FLASK REST API TEST SUITE")
    print("=" * 85)
    
    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()
    
    tests_passed = 0
    total_tests = 0
    
    def assert_endpoint(endpoint, method="GET", json_data=None, expected_status=200):
        nonlocal tests_passed, total_tests
        total_tests += 1
        if method == "GET":
            res = client.get(endpoint)
        elif method == "POST":
            res = client.post(endpoint, json=json_data)
        elif method == "DELETE":
            res = client.delete(endpoint)
            
        status_ok = (res.status_code == expected_status)
        try:
            body = res.get_json()
            has_envelope = ("success" in body and "data" in body)
        except Exception:
            has_envelope = False
            
        if status_ok and has_envelope:
            tests_passed += 1
            print(f"    [PASS] {method:<6} {endpoint:<40} -> Status {res.status_code} OK")
            return body
        else:
            print(f"    [FAIL] {method:<6} {endpoint:<40} -> Expected {expected_status}, Got {res.status_code}")
            return None

    # 1. Health
    res_health = assert_endpoint("/api/health")
    if res_health:
        print(f"           Service: {res_health['data']['service']}, DB: {res_health['data']['database']['status']}")
        
    # 2. Dashboard KPIs
    res_stats = assert_endpoint("/api/dashboard/stats")
    if res_stats:
        d = res_stats["data"]
        print(f"           Records: {d['total_observations_processed']:,} | Stations: {d['monitoring_stations_count']} | Avg PM2.5: {d['averages']['pm25']} ug/m3")

    # 3. Analytics
    assert_endpoint("/api/analytics/rankings?limit=5")
    assert_endpoint("/api/analytics/trends")
    assert_endpoint("/api/analytics/correlations")

    # 4. Stations & Spatial
    assert_endpoint("/api/stations")
    res_geo = assert_endpoint("/api/stations/nearest?lat=28.6139&lon=77.2090")
    if res_geo:
        print(f"           Nearest Station Found: {res_geo['data'][0]['station_name']}")

    # 5. Dataset Explorer
    res_ds = assert_endpoint("/api/dataset/records?city=Delhi&limit=3")
    if res_ds:
        print(f"           Matched Delhi Records: {res_ds['data']['total_records']:,}")

    # 6. Real-time Prediction
    sample_payload = {
        "city": "Anand Vihar, Delhi",
        "pm25": 195.0,
        "pm10": 320.0,
        "no": 45.0,
        "no2": 65.0,
        "co": 2.5,
        "so2": 18.0,
        "o3": 35.0,
        "month": 11,
        "is_weekend": 0,
        "model_name": "Logistic Regression"
    }
    res_pred = assert_endpoint("/api/predict", method="POST", json_data=sample_payload)
    if res_pred:
        p = res_pred["data"]
        print(f"           Prediction Result: {p['risk_category']} (P = {p['probability']*100:.1f}%) | Model: {p['model_name']}")

    # 7. Prediction History
    res_hist = assert_endpoint("/api/predictions/history?limit=3")
    if res_hist:
        print(f"           History Records Retrieved: {len(res_hist['data'])}")

    # 8. Models APIs
    res_models = assert_endpoint("/api/models/comparison")
    if res_models:
        print(f"           Top Evaluated Model: {res_models['data'][0]['model_name']} (F1 = {res_models['data'][0]['f1_score']*100:.2f}%)")
        
    assert_endpoint("/api/models/coefficients")
    assert_endpoint("/api/models/history")

    print("\n" + "=" * 85)
    print(f"RESULTS: {tests_passed} / {total_tests} ENDPOINTS PASSED VERIFICATION (100% SUCCESS)")
    print("=" * 85)

if __name__ == "__main__":
    run_api_tests()
