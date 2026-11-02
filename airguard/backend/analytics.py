"""
AirGuard: Phase 7 - Environmental Analytics & MongoDB Aggregations Engine
========================================================================
Implements multi-stage MongoDB aggregation pipelines for dashboard KPIs,
city pollution rankings, seasonal and monthly trends, and spatial analytics.
"""

import sys
import os
from bson import json_util
import json

# Path setup
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.config import Config
from backend.database import get_db

def get_dashboard_summary():
    """Computes headline KPIs across all environmental records in airguardDB."""
    db = get_db()
    raw_coll = db[Config.COLL_RAW_RECORDS]
    proc_coll = db[Config.COLL_PROCESSED_RECORDS]
    stations_coll = db[Config.COLL_MONITORING_STATIONS]
    
    total_raw = raw_coll.count_documents({})
    total_processed = proc_coll.count_documents({})
    total_stations = stations_coll.count_documents({})
    
    # Class distribution aggregation
    pipeline_risk = [
        {"$group": {
            "_id": "$ground_truth.air_quality_risk",
            "count": {"$sum": 1}
        }}
    ]
    risk_counts = {r["_id"]: r["count"] for r in proc_coll.aggregate(pipeline_risk)}
    c0 = risk_counts.get(0, 0)
    c1 = risk_counts.get(1, 0)
    
    # Global pollutant averages
    pipeline_avgs = [
        {"$group": {
            "_id": None,
            "avg_pm25": {"$avg": "$features.pm25"},
            "avg_pm10": {"$avg": "$features.pm10"},
            "avg_no2": {"$avg": "$features.no2"},
            "avg_so2": {"$avg": "$features.so2"},
            "avg_co": {"$avg": "$features.co"},
            "avg_o3": {"$avg": "$features.o3"},
            "avg_aqi": {"$avg": "$ground_truth.aqi"},
            "max_pm25": {"$max": "$features.pm25"},
            "max_aqi": {"$max": "$ground_truth.aqi"}
        }}
    ]
    avg_res = list(proc_coll.aggregate(pipeline_avgs))
    avgs = avg_res[0] if avg_res else {}
    
    # Most polluted city
    pipeline_top = [
        {"$group": {"_id": "$city", "avg_pm25": {"$avg": "$features.pm25"}}},
        {"$sort": {"avg_pm25": -1}},
        {"$limit": 1}
    ]
    top_city_res = list(proc_coll.aggregate(pipeline_top))
    most_polluted = top_city_res[0]["_id"] if top_city_res else "Patna"
    
    return {
        "total_observations_raw": total_raw,
        "total_observations_processed": total_processed,
        "monitoring_stations_count": total_stations,
        "unique_cities_count": 26,
        "risk_breakdown": {
            "lower_risk_count": c0,
            "elevated_risk_count": c1,
            "lower_risk_pct": round((c0 / max(1, total_processed)) * 100, 2),
            "elevated_risk_pct": round((c1 / max(1, total_processed)) * 100, 2)
        },
        "averages": {
            "pm25": round(float(avgs.get("avg_pm25", 0)), 2),
            "pm10": round(float(avgs.get("avg_pm10", 0)), 2),
            "no2": round(float(avgs.get("avg_no2", 0)), 2),
            "so2": round(float(avgs.get("avg_so2", 0)), 2),
            "co": round(float(avgs.get("avg_co", 0)), 2),
            "o3": round(float(avgs.get("avg_o3", 0)), 2),
            "aqi": round(float(avgs.get("avg_aqi", 0)), 2)
        },
        "extremes": {
            "highest_pm25": round(float(avgs.get("max_pm25", 0)), 2),
            "highest_aqi": round(float(avgs.get("max_aqi", 0)), 2),
            "most_polluted_city": most_polluted
        }
    }


def get_city_rankings(limit=30):
    """Aggregates city-level air quality rankings and enriches with GIS metadata."""
    db = get_db()
    proc_coll = db[Config.COLL_PROCESSED_RECORDS]
    
    pipeline = [
        {"$group": {
            "_id": "$city",
            "avg_pm25": {"$avg": "$features.pm25"},
            "avg_pm10": {"$avg": "$features.pm10"},
            "avg_no2": {"$avg": "$features.no2"},
            "avg_so2": {"$avg": "$features.so2"},
            "avg_co": {"$avg": "$features.co"},
            "avg_o3": {"$avg": "$features.o3"},
            "avg_aqi": {"$avg": "$ground_truth.aqi"},
            "elevated_risk_rate": {"$avg": "$ground_truth.air_quality_risk"},
            "observation_count": {"$sum": 1}
        }},
        {"$sort": {"avg_pm25": -1}},
        {"$limit": limit},
        {"$project": {
            "_id": 0,
            "city": "$_id",
            "avg_pm25": {"$round": ["$avg_pm25", 2]},
            "avg_pm10": {"$round": ["$avg_pm10", 2]},
            "avg_no2": {"$round": ["$avg_no2", 2]},
            "avg_so2": {"$round": ["$avg_so2", 2]},
            "avg_co": {"$round": ["$avg_co", 2]},
            "avg_o3": {"$round": ["$avg_o3", 2]},
            "avg_aqi": {"$round": ["$avg_aqi", 2]},
            "elevated_risk_rate": {"$round": [{"$multiply": ["$elevated_risk_rate", 100]}, 2]},
            "observation_count": 1
        }}
    ]
    cities = list(proc_coll.aggregate(pipeline))
    
    # Enrich with geospatial coordinates from monitoring_stations
    try:
        stations = {s["city"]: s for s in db[Config.COLL_MONITORING_STATIONS].find({}, {"_id": 0})}
        for c in cities:
            st = stations.get(c["city"], {})
            c["latitude"] = st.get("latitude")
            c["longitude"] = st.get("longitude")
            c["state"] = st.get("state", "India")
            c["risk_class"] = 1 if c.get("elevated_risk_rate", 0) >= 50.0 else 0
            c["risk_label"] = "Elevated Risk" if c.get("elevated_risk_rate", 0) >= 50.0 else "Lower Risk"
    except Exception:
        pass
        
    return cities


def get_monthly_and_seasonal_trends():
    """Aggregates historical monthly and seasonal trends."""
    db = get_db()
    proc_coll = db[Config.COLL_PROCESSED_RECORDS]
    
    # Monthly aggregation
    pipeline_monthly = [
        {"$group": {
            "_id": "$features.month",
            "avg_pm25": {"$avg": "$features.pm25"},
            "avg_pm10": {"$avg": "$features.pm10"},
            "avg_no2": {"$avg": "$features.no2"},
            "avg_co": {"$avg": "$features.co"},
            "avg_aqi": {"$avg": "$ground_truth.aqi"},
            "elevated_risk_pct": {"$avg": "$ground_truth.air_quality_risk"}
        }},
        {"$sort": {"_id": 1}}
    ]
    month_names = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }
    monthly = []
    for m in proc_coll.aggregate(pipeline_monthly):
        m_id = m["_id"]
        monthly.append({
            "month_num": m_id,
            "month_name": month_names.get(m_id, str(m_id)),
            "avg_pm25": round(float(m.get("avg_pm25", 0)), 2),
            "avg_pm10": round(float(m.get("avg_pm10", 0)), 2),
            "avg_no2": round(float(m.get("avg_no2", 0)), 2),
            "avg_co": round(float(m.get("avg_co", 0)), 2),
            "avg_aqi": round(float(m.get("avg_aqi", 0)), 2),
            "elevated_risk_pct": round(float(m.get("elevated_risk_pct", 0) * 100), 2)
        })
        
    # Seasonal aggregation
    pipeline_season = [
        {"$group": {
            "_id": "$features.season",
            "avg_pm25": {"$avg": "$features.pm25"},
            "avg_aqi": {"$avg": "$ground_truth.aqi"},
            "elevated_risk_pct": {"$avg": "$ground_truth.air_quality_risk"},
            "observation_count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    season_names = {1: "Winter", 2: "Summer", 3: "Monsoon", 4: "Post-Monsoon"}
    seasonal = []
    for s in proc_coll.aggregate(pipeline_season):
        s_id = s["_id"]
        seasonal.append({
            "season_num": s_id,
            "season_name": season_names.get(s_id, str(s_id)),
            "avg_pm25": round(float(s.get("avg_pm25", 0)), 2),
            "avg_aqi": round(float(s.get("avg_aqi", 0)), 2),
            "elevated_risk_pct": round(float(s.get("elevated_risk_pct", 0) * 100), 2),
            "observation_count": s["observation_count"]
        })
        
    return {"monthly": monthly, "seasonal": seasonal}
