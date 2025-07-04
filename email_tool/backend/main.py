from fastapi import FastAPI
import asyncio
from .data_access.database import init_db
from .routers import api

# Import all models to ensure they are registered with SQLAlchemy
from .models import (
    Campaign, Template, LocalizedCopy, GeneratedEmail, 
    Placeholder, PlaywrightResult
)
from .models.tag import Tag
from .models.campaign_tag import campaign_tags

asyncio.run(init_db())

app = FastAPI()
app.include_router(api.router)
