from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, desc
from ..models.test_result import TestResult

class TestResultRepository:
    async def get_by_scenario(self, db: AsyncSession, scenario_id: int):
        result = await db.execute(
            select(TestResult)
            .where(TestResult.scenario_id == scenario_id)
            .order_by(desc(TestResult.execution_time))
        )
        return result.scalars().all()

    async def get_latest_by_scenario(self, db: AsyncSession, scenario_id: int):
        result = await db.execute(
            select(TestResult)
            .where(TestResult.scenario_id == scenario_id)
            .order_by(desc(TestResult.execution_time))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get(self, db: AsyncSession, result_id: int):
        result = await db.execute(select(TestResult).where(TestResult.id == result_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, test_result: TestResult):
        db.add(test_result)
        await db.commit()
        await db.refresh(test_result)
        return test_result

    async def delete(self, db: AsyncSession, result_id: int):
        await db.execute(delete(TestResult).where(TestResult.id == result_id))
        await db.commit() 