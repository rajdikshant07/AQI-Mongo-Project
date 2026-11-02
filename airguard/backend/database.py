"""
AirGuard: Database Connection Factory (PyMongo Integration)
===========================================================
Implements singleton MongoDB client connection management, database access,
and connection pooling in accordance with academic and production standards.
"""

import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from .config import Config

_client = None
_db = None

def get_mongo_client():
    """Initializes or returns the active PyMongo MongoClient singleton."""
    global _client
    if _client is None:
        try:
            _client = MongoClient(
                Config.MONGO_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                maxPoolSize=50,
                retryWrites=True
            )
            # Verify connectivity immediately
            _client.admin.command("ping")
        except (ConnectionFailure, ServerSelectionTimeoutError) as err:
            print(f"[FATAL] Failed to connect to MongoDB at {Config.MONGO_URI}: {err}", file=sys.stderr)
            raise ConnectionError(f"MongoDB connection failed: {err}")
    return _client

def get_db():
    """Returns the primary AirGuard database handle ('airguardDB')."""
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[Config.DATABASE_NAME]
    return _db

def check_db_connection():
    """Performs a health check ping against the active database."""
    try:
        client = get_mongo_client()
        res = client.admin.command("ping")
        return {"status": "connected", "ping": res.get("ok", 0), "database": Config.DATABASE_NAME}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}

def close_db():
    """Gracefully closes MongoDB connection pool."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
