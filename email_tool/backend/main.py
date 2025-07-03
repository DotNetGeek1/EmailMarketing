from fastapi import FastAPI
import asyncio
from .data_access.database import init_db
from .routers import api

asyncio.run(init_db())

app = FastAPI()
app.include_router(api.router)
