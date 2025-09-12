from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'fra-connect-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="FRA-Connect API", description="Forest Rights Atlas & Decision Support System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    full_name: str
    role: str  # admin, officer, verifier, viewer
    department: str
    state: Optional[str] = None
    district: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "viewer"
    department: str
    state: Optional[str] = None
    district: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class Village(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    state: str
    district: str
    tehsil: str
    village_code: str
    total_area: float  # in hectares
    forest_area: float
    coordinates: Dict[str, Any]  # GeoJSON
    population: int
    tribal_population: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForestClaim(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    claim_type: str  # IFR (Individual Forest Rights) or CFR (Community Forest Rights)
    claim_number: str
    village_id: str
    village_name: str
    beneficiary_name: str
    beneficiary_father_name: str
    area_claimed: float  # in hectares
    coordinates: Dict[str, Any]  # GeoJSON polygon
    status: str  # pending, under_review, approved, rejected, disputed
    submitted_date: datetime
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    assigned_officer: Optional[str] = None
    ai_recommendation: Optional[Dict[str, Any]] = None
    ocr_documents: List[Dict[str, Any]] = []
    linked_schemes: List[str] = []  # MGNREGA, PM-KISAN, etc.

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

class CaseUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    ai_recommendation: Optional[Dict[str, Any]] = None

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return User(**user)

# Authentication endpoints
@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user_dict["hashed_password"] = hashed_password
    
    user = User(**user_dict)
    await db.users.insert_one(user.dict())
    return user

@api_router.post("/auth/login", response_model=Token)
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Remove MongoDB _id and hashed_password from user data
    user_data = {k: v for k, v in user.items() if k not in ["_id", "hashed_password"]}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Dashboard endpoints
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    # Get counts from database
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
        ocr_accuracy=87.5,  # Mock data
        schemes_integrated=4,  # MGNREGA, PM-KISAN, etc.
        total_budget_linked=125000000.0  # 12.5 crores
    )

# Village endpoints
@api_router.get("/villages", response_model=List[Village])
async def get_villages(
    state: Optional[str] = None,
    district: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if state:
        query["state"] = state
    if district:
        query["district"] = district
    
    villages = await db.villages.find(query).to_list(1000)
    return [Village(**village) for village in villages]

@api_router.post("/villages", response_model=Village)
async def create_village(village_data: Village, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to create villages")
    
    village = Village(**village_data.dict())
    await db.villages.insert_one(village.dict())
    return village

# Forest claims endpoints
@api_router.get("/claims", response_model=List[ForestClaim])
async def get_forest_claims(
    status: Optional[str] = None,
    village_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if village_id:
        query["village_id"] = village_id
    
    # Filter by user's jurisdiction if not admin
    if current_user.role != "admin":
        if current_user.district:
            # Get villages in user's district
            district_villages = await db.villages.find({"district": current_user.district}).to_list(1000)
            village_ids = [v["id"] for v in district_villages]
            query["village_id"] = {"$in": village_ids}
    
    claims = await db.forest_claims.find(query).sort("submitted_date", -1).to_list(1000)
    return [ForestClaim(**claim) for claim in claims]

@api_router.post("/claims", response_model=ForestClaim)
async def create_forest_claim(claim_data: ClaimCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "officer", "verifier"]:
        raise HTTPException(status_code=403, detail="Not authorized to create claims")
    
    claim_dict = claim_data.dict()
    claim_dict["claim_number"] = f"FRA-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    claim_dict["status"] = "pending"
    claim_dict["submitted_date"] = datetime.now(timezone.utc)
    claim_dict["assigned_officer"] = current_user.id
    
    claim = ForestClaim(**claim_dict)
    await db.forest_claims.insert_one(claim.dict())
    return claim

@api_router.get("/claims/{claim_id}", response_model=ForestClaim)
async def get_forest_claim(claim_id: str, current_user: User = Depends(get_current_user)):
    claim = await db.forest_claims.find_one({"id": claim_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return ForestClaim(**claim)

@api_router.put("/claims/{claim_id}/status")
async def update_claim_status(
    claim_id: str, 
    update_data: CaseUpdate, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to update claims")
    
    claim = await db.forest_claims.find_one({"id": claim_id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    update_dict = {
        "status": update_data.status,
        "last_updated": datetime.now(timezone.utc)
    }
    
    if update_data.notes:
        update_dict["notes"] = update_data.notes
    if update_data.ai_recommendation:
        update_dict["ai_recommendation"] = update_data.ai_recommendation
    
    await db.forest_claims.update_one({"id": claim_id}, {"$set": update_dict})
    
    return {"message": "Claim status updated successfully"}

# Initialize sample data
@api_router.post("/init-sample-data")
async def initialize_sample_data():
    # Create sample admin user
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        hashed_password = get_password_hash("admin123")
        user_dict = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@fra-connect.gov.in",
            "full_name": "System Administrator",
            "role": "admin",
            "department": "Forest Department",
            "state": "All",
            "district": "All",
            "hashed_password": hashed_password,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        }
        await db.users.insert_one(user_dict)
    
    # Create sample villages
    villages_count = await db.villages.count_documents({})
    if villages_count == 0:
        sample_villages = [
            Village(
                name="Jharkhand Village",
                state="Jharkhand",
                district="Ranchi",
                tehsil="Ranchi",
                village_code="JH001",
                total_area=2500.0,
                forest_area=1800.0,
                coordinates={"type": "Point", "coordinates": [85.3094, 23.3441]},
                population=1200,
                tribal_population=800
            ),
            Village(
                name="Odisha Forest Village",
                state="Odisha",
                district="Mayurbhanj",
                tehsil="Baripada",
                village_code="OD001",
                total_area=3200.0,
                forest_area=2400.0,
                coordinates={"type": "Point", "coordinates": [86.7347, 21.9347]},
                population=950,
                tribal_population=700
            ),
            Village(
                name="Chhattisgarh Tribal Village",
                state="Chhattisgarh",
                district="Bastar",
                tehsil="Jagdalpur",
                village_code="CG001",
                total_area=4100.0,
                forest_area=3500.0,
                coordinates={"type": "Point", "coordinates": [82.0348, 19.0728]},
                population=1500,
                tribal_population=1300
            )
        ]
        
        for village in sample_villages:
            await db.villages.insert_one(village.dict())
    
    # Create sample forest claims
    claims_count = await db.forest_claims.count_documents({})
    if claims_count == 0:
        villages = await db.villages.find().to_list(10)
        sample_claims = []
        
        for i, village in enumerate(villages):
            claim = ForestClaim(
                claim_type="IFR" if i % 2 == 0 else "CFR",
                claim_number=f"FRA-20240901-{str(uuid.uuid4())[:8].upper()}",
                village_id=village["id"],
                village_name=village["name"],
                beneficiary_name=f"Tribal Beneficiary {i+1}",
                beneficiary_father_name=f"Father {i+1}",
                area_claimed=float(2.5 + i),
                coordinates={
                    "type": "Polygon",
                    "coordinates": [[[85.0 + i*0.1, 23.0 + i*0.1], [85.1 + i*0.1, 23.0 + i*0.1], [85.1 + i*0.1, 23.1 + i*0.1], [85.0 + i*0.1, 23.1 + i*0.1], [85.0 + i*0.1, 23.0 + i*0.1]]]
                },
                status=["pending", "under_review", "approved"][i % 3],
                submitted_date=datetime.now(timezone.utc) - timedelta(days=i*5),
                ai_recommendation={
                    "decision": "approve" if i % 2 == 0 else "review",
                    "confidence": 0.85 + (i % 3) * 0.05,
                    "reasons": ["Valid tribal claim", "Area within limits", "No conflicts detected"]
                },
                linked_schemes=["MGNREGA", "PM-KISAN"] if i % 2 == 0 else ["MGNREGA"]
            )
            sample_claims.append(claim)
        
        for claim in sample_claims:
            await db.forest_claims.insert_one(claim.dict())
    
    return {"message": "Sample data initialized successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()