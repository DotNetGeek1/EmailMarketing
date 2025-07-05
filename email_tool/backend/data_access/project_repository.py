from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.project import Project

class ProjectRepository:
    async def get_all(self, db: AsyncSession):
        result = await db.execute(select(Project))
        return result.scalars().all()

    async def get(self, db: AsyncSession, project_id: int):
        result = await db.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, project: Project):
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    async def update(self, db: AsyncSession, project: Project):
        await db.commit()
        await db.refresh(project)
        return project

    async def delete(self, db: AsyncSession, project_id: int):
        await db.execute(delete(Project).where(Project.id == project_id))
        await db.commit() 