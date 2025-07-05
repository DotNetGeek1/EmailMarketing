from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .data_access.database import init_db
from .routers import api

# Import all models to ensure they are registered with SQLAlchemy
from .models import (
    Project, Template, LocalizedCopy, GeneratedEmail, 
    Placeholder, PlaywrightResult, Tag, TestScenario, TestStep, TestResult, project_tags
)

app = FastAPI()

# Add CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (screenshots)
app.mount("/static", StaticFiles(directory="email_tool/backend/static"), name="static")

@app.on_event("startup")
async def startup_event():
    await init_db()

app.include_router(api.router)
