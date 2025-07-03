from fastapi import FastAPI
from .data_access.database import init_db
from .routers import api

init_db()

app = FastAPI()
app.include_router(api.router)
