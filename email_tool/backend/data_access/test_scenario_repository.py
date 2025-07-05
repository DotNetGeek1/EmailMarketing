from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.test_scenario import TestScenario

class TestScenarioRepository:
    async def get_all(self, db: AsyncSession):
        result = await db.execute(select(TestScenario))
        return result.scalars().all()

    async def get(self, db: AsyncSession, scenario_id: int):
        result = await db.execute(select(TestScenario).where(TestScenario.id == scenario_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, scenario: TestScenario):
        db.add(scenario)
        await db.commit()
        await db.refresh(scenario)
        return scenario

    async def update(self, db: AsyncSession, scenario: TestScenario):
        await db.commit()
        await db.refresh(scenario)
        return scenario

    async def delete(self, db: AsyncSession, scenario_id: int):
        await db.execute(delete(TestScenario).where(TestScenario.id == scenario_id))
        await db.commit() 