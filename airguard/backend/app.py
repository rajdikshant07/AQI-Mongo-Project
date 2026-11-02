"""
AirGuard: Phase 7 - Modular Flask REST API Application
======================================================
Serves RESTful endpoints for dashboard telemetry, environmental analytics,
GIS monitoring station queries, paginated dataset inspection, real-time ML
prediction, and model comparison metrics.
"""

import os
import sys
import json
import numpy as np
from datetime import datetime
from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config
from backend.database import get_db, check_db_connection
from backend.analytics import (
    get_dashboard_summary,
    get_city_rankings,
    get_monthly_and_seasonal_trends
)
from backend.predict import (
    predict_air_quality_risk,
    get_prediction_history,
    load_model
)

def create_app():
    """Application factory for AirGuard REST API."""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for modern React frontend (localhost:3000, 5173, etc.)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # JSON Encoder helper for ObjectId and Datetime
    def json_response(data, status=200, message="Success"):
        return jsonify({
            "success": status < 400,
            "message": message,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }), status

    # =========================================================================
    # 1. HEALTH & SYSTEM DIAGNOSTICS
    # =========================================================================
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_health = check_db_connection()
        return json_response({
            "status": "healthy",
            "service": "AirGuard Environmental Intelligence API",
            "version": "1.0.0",
            "database": db_health
        })

    # =========================================================================
    # 2. DASHBOARD TELEMETRY & KPIS
    # =========================================================================
    @app.route("/api/dashboard/stats", methods=["GET"])
    def dashboard_stats():
        try:
            summary = get_dashboard_summary()
            return json_response(summary)
        except Exception as e:
            return json_response(None, status=500, message=f"Failed to fetch dashboard stats: {str(e)}")

    # =========================================================================
    # 3. ENVIRONMENTAL ANALYTICS
    # =========================================================================
    @app.route("/api/analytics/rankings", methods=["GET"])
    def city_rankings_api():
        limit = request.args.get("limit", default=15, type=int)
        rankings = get_city_rankings(limit=limit)
        return json_response(rankings)

    @app.route("/api/analytics/trends", methods=["GET"])
    def trends_api():
        trends = get_monthly_and_seasonal_trends()
        return json_response(trends)

    @app.route("/api/analytics/correlations", methods=["GET"])
    def correlations_api():
        metrics_file = os.path.join(Config.BASE_DIR, "reports", "eda_summary_metrics.json")
        if os.path.exists(metrics_file):
            with open(metrics_file, "r") as f:
                data = json.load(f)
            return json_response(data.get("target_correlations_ranked", {}))
        return json_response({}, message="Correlation metrics not found.")

    # =========================================================================
    # 4. MONITORING STATIONS (GIS & 2DSPHERE QUERIES)
    # =========================================================================
    @app.route("/api/stations", methods=["GET"])
    def get_stations():
        db = get_db()
        coll = db[Config.COLL_MONITORING_STATIONS]
        cursor = coll.find({}, {"_id": 0})
        stations = list(cursor)
        return json_response(stations)

    @app.route("/api/stations/nearest", methods=["GET"])
    def get_nearest_station():
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)
        max_dist = request.args.get("max_distance_meters", default=100000, type=int)
        
        if lat is None or lon is None:
            return json_response(None, status=400, message="Both 'lat' and 'lon' parameters are required.")
            
        db = get_db()
        coll = db[Config.COLL_MONITORING_STATIONS]
        
        # Geospatial spherical query using 2dsphere index
        geo_query = {
            "location": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "$maxDistance": max_dist
                }
            }
        }
        nearest = list(coll.find(geo_query, {"_id": 0}).limit(5))
        return json_response(nearest)

    # =========================================================================
    # 5. DATASET EXPLORER & PAGINATION
    # =========================================================================
    @app.route("/api/dataset/records", methods=["GET"])
    def get_dataset_records():
        page = request.args.get("page", default=1, type=int)
        limit = request.args.get("limit", default=25, type=int)
        city = request.args.get("city", default=None, type=str)
        risk = request.args.get("risk", default=None, type=str)
        start_date = request.args.get("startDate", default=None, type=str)
        end_date = request.args.get("endDate", default=None, type=str)
        
        db = get_db()
        coll = db[Config.COLL_PROCESSED_RECORDS]
        
        query = {}
        if city:
            query["city"] = city
        if risk is not None and risk != "":
            query["ground_truth.air_quality_risk"] = int(risk)
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            query["date"] = date_filter
            
        total_matched = coll.count_documents(query)
        skip = (page - 1) * limit
        
        cursor = coll.find(query, {"_id": 0}).sort("date", -1).skip(skip).limit(limit)
        records = list(cursor)
        
        return json_response({
            "page": page,
            "limit": limit,
            "total_records": total_matched,
            "total_pages": (total_matched + limit - 1) // limit,
            "records": records
        })

    # =========================================================================
    # 6. MACHINE LEARNING PREDICTION
    # =========================================================================
    @app.route("/api/predict", methods=["POST"])
    def predict_risk():
        data = request.get_json()
        if not data:
            return json_response(None, status=400, message="Missing JSON request payload.")
            
        model_name = data.get("model_name", "Logistic Regression")
        station_name = data.get("station_or_city", data.get("city", "Station Input"))
        
        try:
            result = predict_air_quality_risk(
                raw_inputs=data,
                model_name=model_name,
                station_or_city=station_name,
                save_to_db=True
            )
            return json_response(result, message="Air quality risk prediction generated successfully.")
        except Exception as e:
            return json_response(None, status=500, message=f"Prediction error: {str(e)}")

    @app.route("/api/predictions/history", methods=["GET"])
    def prediction_history_api():
        limit = request.args.get("limit", default=50, type=int)
        filter_risk = request.args.get("risk", default=None)
        model_name = request.args.get("model", default=None)
        
        history = get_prediction_history(limit=limit, filter_risk=filter_risk, model_name=model_name)
        return json_response(history)

    @app.route("/api/predictions/history/<pred_id>", methods=["DELETE"])
    def delete_prediction_api(pred_id):
        db = get_db()
        coll = db[Config.COLL_PREDICTION_RESULTS]
        try:
            res = coll.delete_one({"_id": ObjectId(pred_id)})
            if res.deleted_count > 0:
                return json_response({"deleted_id": pred_id}, message="Prediction audit record deleted.")
            return json_response(None, status=404, message="Prediction record not found.")
        except Exception as e:
            return json_response(None, status=500, message=f"Failed to delete record: {str(e)}")

    # =========================================================================
    # 7. MODEL EVALUATION & COMPARISON METRICS
    # =========================================================================
    @app.route("/api/models/comparison", methods=["GET"])
    def model_comparison_api():
        db = get_db()
        eval_coll = db[Config.COLL_MODEL_EVALUATION]
        cursor = eval_coll.find({}, {"_id": 0}).sort("f1_score", -1)
        models = list(cursor)
        return json_response(models)

    @app.route("/api/models/coefficients", methods=["GET"])
    def model_coefficients_api():
        try:
            lr, _ = load_model("Logistic Regression")
            from backend.predict import FEATURE_COLUMNS
            coefs = lr.coef_[0]
            odds = [float(np.exp(c)) for c in coefs]
            
            records = []
            for feat, beta, or_val in zip(FEATURE_COLUMNS, coefs, odds):
                records.append({
                    "feature": feat,
                    "coefficient": round(float(beta), 4),
                    "odds_ratio": round(float(or_val), 3),
                    "impact": "Increases Risk" if beta > 0 else "Decreases Risk"
                })
            records = sorted(records, key=lambda x: abs(x["coefficient"]), reverse=True)
            return json_response({
                "intercept": round(float(lr.intercept_[0]), 4),
                "coefficients": records
            })
        except Exception as e:
            return json_response(None, status=500, message=f"Error extracting coefficients: {str(e)}")

    @app.route("/api/models/history", methods=["GET"])
    def model_history_api():
        db = get_db()
        coll = db[Config.COLL_TRAINING_HISTORY]
        cursor = coll.find({}, {"_id": 0}).sort("trained_at", -1)
        return json_response(list(cursor))

    return app

if __name__ == "__main__":
    app = create_app()
    port = Config.PORT
    print(f"[*] Starting AirGuard Flask REST API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
