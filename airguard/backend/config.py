"""
AirGuard: Backend Configuration Module
======================================
Loads environment variables, defines collection schemas, and manages
connection settings across development, testing, and production.
"""

import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Config:
    BASE_DIR = BASE_DIR
    # MongoDB Settings
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "airguardDB")
    
    # Collection Names (as defined in Professor requirements)
    COLL_RAW_RECORDS = "air_quality_records"
    COLL_PROCESSED_RECORDS = "processed_records"
    COLL_PREDICTION_RESULTS = "prediction_results"
    COLL_MODEL_EVALUATION = "model_evaluation"
    COLL_TRAINING_HISTORY = "training_history"
    COLL_DATASET_METADATA = "dataset_metadata"
    COLL_MONITORING_STATIONS = "monitoring_stations"
    
    # Paths
    RAW_DATASET_PATH = os.path.join(BASE_DIR, "dataset", "raw", "city_day.csv")
    STATIONS_DATASET_PATH = os.path.join(BASE_DIR, "dataset", "raw", "stations.csv")
    METADATA_PATH = os.path.join(BASE_DIR, "dataset", "metadata", "dataset_inspection_report.json")
    MODEL_DIR = os.path.join(BASE_DIR, "models")
    
    # Flask Settings
    PORT = int(os.getenv("FLASK_PORT", 5000))
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "airguard-academic-secret-key-2026")
