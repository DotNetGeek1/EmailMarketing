from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from ..models import Base
import os

# Use absolute path for database in Docker container
DATABASE_URL = 'sqlite+aiosqlite:////app/db.sqlite3'

engine = create_async_engine(DATABASE_URL, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def init_db():
    """Initialize database and create tables if they don't exist"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Database initialization error: {e}")
        # Continue anyway - the database will be created when first accessed


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
