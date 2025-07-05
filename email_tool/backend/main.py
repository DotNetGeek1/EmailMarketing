from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .data_access.database import init_db, get_db
from .routers import api
from .services.marketing_group_service import MarketingGroupService

# Import all models to ensure they are registered with SQLAlchemy
from .models import (
    Project, Template, LocalizedCopy, GeneratedEmail, 
    Placeholder, PlaywrightResult, Tag, TestScenario, TestStep, TestResult, project_tags
)

app = FastAPI()

# Add CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React (CRA)
        "http://localhost:5173",  # Vite/React
        # Add your production frontend URL here, e.g. "https://yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (screenshots)
app.mount("/static", StaticFiles(directory="email_tool/backend/static"), name="static")

@app.on_event("startup")
async def startup_event():
    await init_db()
    print("✅ CORS middleware enabled for development origins.")
    
    # Seed marketing group types if they don't exist
    try:
        from .data_access.seed_marketing_group_types import seed_marketing_group_types
        await seed_marketing_group_types()
        print("✅ Marketing group types seeded successfully")
    except Exception as e:
        print(f"⚠️  Warning: Could not seed marketing group types: {e}")
        # Continue anyway - the application will work without seeding

app.include_router(api.router)
