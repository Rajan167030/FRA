from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
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

# Create the main app without a prefix
app = FastAPI(title="FRA-Connect API", description="Forest Rights Atlas & Decision Support System")

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

# API Endpoints
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
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

@api_router.get("/villages", response_model=List[Village])
async def get_villages(state: Optional[str] = None, district: Optional[str] = None):
    query = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    villages = await db.villages.find(query).to_list(1000)
    return villages

@api_router.post("/villages", response_model=Village)
async def create_village(village_data: Village):
    village = Village(**village_data.dict())
    await db.villages.insert_one(village.dict())
    return village

@api_router.get("/claims", response_model=List[ForestClaim])
async def get_forest_claims(status: Optional[str] = None, village_id: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    if village_id:
        query["village_id"] = village_id
    claims = await db.forest_claims.find(query).sort("submitted_date", -1).to_list(1000)
    return claims

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
