from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.test_step import TestStep

class TestStepRepository:
    async def get_by_scenario(self, db: AsyncSession, scenario_id: int):
        result = await db.execute(select(TestStep).where(TestStep.scenario_id == scenario_id).order_by(TestStep.step_order))
        return result.scalars().all()

    async def get(self, db: AsyncSession, step_id: int):
        result = await db.execute(select(TestStep).where(TestStep.id == step_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, step: TestStep):
        db.add(step)
        await db.commit()
        await db.refresh(step)
        return step

    async def update(self, db: AsyncSession, step: TestStep):
        await db.commit()
        await db.refresh(step)
        return step

    async def delete(self, db: AsyncSession, step_id: int):
        await db.execute(delete(TestStep).where(TestStep.id == step_id))
        await db.commit() 