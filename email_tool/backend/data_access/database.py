import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from ..models import Base

DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql+asyncpg://{}:{}@postgres:5432/{}'.format(
        os.getenv('POSTGRES_USER', 'emailuser'),
        os.getenv('POSTGRES_PASSWORD', 'emailpass'),
        os.getenv('POSTGRES_DB', 'emaildb')
    )
)

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
