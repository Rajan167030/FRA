from fastapi import FastAPI, APIRouter, Query, HTTPException
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'fra_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Global flag to track DB availability
db_available = False

# Create the main app without a prefix
app = FastAPI(title="FRA-Connect API", description="Forest Rights Atlas & Decision Support System")

# Check database connection on startup (synchronously)
try:
    # Try to connect to MongoDB synchronously
    test_client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=1000)
    test_client.server_info()  # This will raise an exception if the connection fails
    db_available = True
    print("✅ MongoDB connection successful")
except Exception as e:
    db_available = False
    print(f"❌ MongoDB unavailable - database required for operation: {e}")

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Data Models
class Village(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    state: str
    district: str
    tehsil: str
    village_code: str
    total_area: float
    forest_area: float
    coordinates: Dict[str, Any]
    population: int
    tribal_population: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForestClaim(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    claim_type: str
    claim_number: str
    village_id: str
    village_name: str
    beneficiary_name: str
    beneficiary_father_name: str
    area_claimed: float
    coordinates: Dict[str, Any]
    status: str
    submitted_date: datetime
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    assigned_officer: Optional[str] = None
    ai_recommendation: Optional[Dict[str, Any]] = None
    ocr_documents: List[Dict[str, Any]] = []
    linked_schemes: List[str] = []

class ClaimCreate(BaseModel):
    claim_type: str
    village_id: str
    village_name: str
    beneficiary_name: str
    beneficiary_father_name: str
    area_claimed: float
    coordinates: Dict[str, Any]

class DashboardStats(BaseModel):
    total_villages: int
    total_claims: int
    pending_claims: int
    approved_claims: int
    disputed_claims: int
    ocr_accuracy: float
    schemes_integrated: int
    total_budget_linked: float

# Spatial Query Models
class BoundingBox(BaseModel):
    min_lat: float = Field(..., description="Minimum latitude")
    max_lat: float = Field(..., description="Maximum latitude")
    min_lon: float = Field(..., description="Minimum longitude")
    max_lon: float = Field(..., description="Maximum longitude")

class SpatialQueryResult(BaseModel):
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]

class VillageGeoJSON(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class ClaimGeoJSON(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

# API Endpoints
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    try:
        # Database connection required - no fallback
        total_villages = await db.villages.count_documents({})
        total_claims = await db.forest_claims.count_documents({})
        pending_claims = await db.forest_claims.count_documents({"status": "pending"})
        approved_claims = await db.forest_claims.count_documents({"status": "approved"})
        disputed_claims = await db.forest_claims.count_documents({"status": "disputed"})
        
        return DashboardStats(
            total_villages=total_villages,
            total_claims=total_claims,
            pending_claims=pending_claims,
            approved_claims=approved_claims,
            disputed_claims=disputed_claims,
            ocr_accuracy=87.5,
            schemes_integrated=4,
            total_budget_linked=125000000.0
        )
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")

@api_router.get("/villages", response_model=List[Village])
async def get_villages(state: Optional[str] = None, district: Optional[str] = None):
    try:
        query = {}
        if state:
            query["state"] = state
        if district:
            query["district"] = district
        villages = await db.villages.find(query).to_list(1000)
        return villages
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")

@api_router.post("/villages", response_model=Village)
async def create_village(village_data: Village):
    village = Village(**village_data.dict())
    await db.villages.insert_one(village.dict())
    return village

@api_router.get("/claims", response_model=List[ForestClaim])
async def get_forest_claims(status: Optional[str] = None, village_id: Optional[str] = None):
    try:
        query = {}
        if status:
            query["status"] = status
        if village_id:
            query["village_id"] = village_id
        claims = await db.forest_claims.find(query).sort("submitted_date", -1).to_list(1000)
        return claims
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")

@api_router.post("/claims", response_model=ForestClaim)
async def create_forest_claim(claim_data: ClaimCreate):
    claim_dict = claim_data.dict()
    claim_dict["claim_number"] = f"FRA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    claim_dict["status"] = "pending"
    claim_dict["submitted_date"] = datetime.now(timezone.utc)
    
    claim = ForestClaim(**claim_dict)
    await db.forest_claims.insert_one(claim.dict())
    return claim

# Include the router in the main app
app.include_router(api_router)

# Enhanced Spatial Query Endpoints
@api_router.get("/villages/geojson", response_model=SpatialQueryResult)
async def get_villages_geojson(
    bbox: Optional[str] = Query(None, description="Bounding box as min_lon,min_lat,max_lon,max_lat"),
    state: Optional[str] = None,
    district: Optional[str] = None
):
    """Get villages in GeoJSON format with optional spatial filtering"""
    query = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    
    # Parse bounding box if provided
    if bbox:
        try:
            min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(','))
            # For MongoDB spatial queries, use proper geospatial indexing:
            # query["coordinates.geometry"] = {
            #     "$geoWithin": {
            #         "$box": [[min_lon, min_lat], [max_lon, max_lat]]
            #     }
            # }
            # For now, we'll filter in-memory for demonstration
        except ValueError:
            bbox = None
    
    villages = await db.villages.find(query).to_list(1000)
    
    features = []
    for village in villages:
        # Convert to GeoJSON feature
        lat = village.get("coordinates", {}).get("latitude") or 0
        lon = village.get("coordinates", {}).get("longitude") or 0
        
        # Apply bbox filter if provided
        if bbox:
            min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(','))
            if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
                continue
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "id": village["id"],
                "name": village["name"],
                "state": village["state"],
                "district": village["district"],
                "village_code": village.get("village_code", ""),
                "total_area": village.get("total_area", 0),
                "forest_area": village.get("forest_area", 0),
                "population": village.get("population", 0),
                "tribal_population": village.get("tribal_population", 0)
            }
        }
        features.append(feature)
    
    return SpatialQueryResult(features=features)

@api_router.get("/claims/geojson", response_model=SpatialQueryResult)
async def get_claims_geojson(
    bbox: Optional[str] = Query(None, description="Bounding box as min_lon,min_lat,max_lon,max_lat"),
    status: Optional[str] = None,
    village_id: Optional[str] = None
):
    """Get forest claims in GeoJSON format with optional spatial filtering"""
    query = {}
    if status:
        query["status"] = status
    if village_id:
        query["village_id"] = village_id
    
    claims = await db.forest_claims.find(query).sort("submitted_date", -1).to_list(1000)
    
    features = []
    for claim in claims:
        # Convert to GeoJSON feature
        lat = claim.get("coordinates", {}).get("latitude") or 0
        lon = claim.get("coordinates", {}).get("longitude") or 0
        
        # Apply bbox filter if provided
        if bbox:
            try:
                min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(','))
                if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
                    continue
            except ValueError:
                continue
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "id": claim["id"],
                "claim_type": claim["claim_type"],
                "claim_number": claim.get("claim_number", ""),
                "village_id": claim["village_id"],
                "village_name": claim["village_name"],
                "beneficiary_name": claim["beneficiary_name"],
                "area_claimed": claim["area_claimed"],
                "status": claim["status"],
                "submitted_date": claim["submitted_date"].isoformat() if isinstance(claim.get("submitted_date"), datetime) else claim.get("submitted_date")
            }
        }
        features.append(feature)
    
    return SpatialQueryResult(features=features)

@api_router.get("/villages/spatial/stats")
async def get_spatial_stats(
    bbox: str = Query(..., description="Bounding box as min_lon,min_lat,max_lon,max_lat")
):
    """Get statistics for villages and claims within a bounding box"""
    try:
        min_lon, min_lat, max_lon, max_lat = map(float, bbox.split(','))
    except ValueError:
        return {"error": "Invalid bounding box format. Use: min_lon,min_lat,max_lon,max_lat"}
    
    # Get all villages and filter by bbox
    villages = await db.villages.find({}).to_list(1000)
    claims = await db.forest_claims.find({}).to_list(1000)
    
    villages_in_bbox = []
    claims_in_bbox = []
    
    for village in villages:
        lat = village.get("coordinates", {}).get("latitude") or 0
        lon = village.get("coordinates", {}).get("longitude") or 0
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            villages_in_bbox.append(village)
    
    for claim in claims:
        lat = claim.get("coordinates", {}).get("latitude") or 0
        lon = claim.get("coordinates", {}).get("longitude") or 0
        if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
            claims_in_bbox.append(claim)
    
    # Calculate statistics
    total_forest_area = sum(v.get("forest_area", 0) for v in villages_in_bbox)
    total_population = sum(v.get("population", 0) for v in villages_in_bbox)
    total_tribal_population = sum(v.get("tribal_population", 0) for v in villages_in_bbox)
    
    status_counts = {}
    for claim in claims_in_bbox:
        status = claim.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return {
        "bbox": {
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lon": min_lon,
            "max_lon": max_lon
        },
        "villages_count": len(villages_in_bbox),
        "claims_count": len(claims_in_bbox),
        "total_forest_area": total_forest_area,
        "total_population": total_population,
        "total_tribal_population": total_tribal_population,
        "claim_status_distribution": status_counts,
        "states_covered": list(set(v.get("state") for v in villages_in_bbox if v.get("state"))),
        "districts_covered": list(set(v.get("district") for v in villages_in_bbox if v.get("district")))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
