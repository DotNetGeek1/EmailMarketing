from email_tool.backend.models.marketing_group_type import MarketingGroupType
from email_tool.backend.data_access.database import AsyncSessionLocal, engine
import asyncio

MARKETING_GROUP_TYPES = [
    {"label": "D2C", "code": "D2C"},
    {"label": "Creative Pro", "code": "CPro"},
    {"label": "Consumer", "code": "CONS"},
    {"label": "Gaming", "code": "Gam"},
    {"label": "NAS", "code": "NAS"},
    {"label": "Surveillance", "code": "SV"},
    {"label": "Other (multiple POIs)", "code": "Other"},
    {"label": "Seagate Partner", "code": "SPP"},
    {"label": "Enterprise Drives", "code": "ED"},
    {"label": "Lyve Cloud", "code": "LC"},
    {"label": "Lyve Mobile", "code": "LM"},
    {"label": "Systems", "code": "Sys"},
]

async def seed_types():
    async with AsyncSessionLocal() as session:
        for t in MARKETING_GROUP_TYPES:
            exists = await session.execute(
                MarketingGroupType.__table__.select().where(MarketingGroupType.code == t["code"]) 
            )
            if not exists.first():
                obj = MarketingGroupType(**t)
                session.add(obj)
        await session.commit()

if __name__ == "__main__":
    asyncio.run(seed_types()) 