from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.generated_email import GeneratedEmail

class GeneratedEmailRepository:
    async def get_by_project(self, db: AsyncSession, project_id: int):
        result = await db.execute(select(GeneratedEmail).where(GeneratedEmail.project_id == project_id))
        return result.scalars().all()

    async def get(self, db: AsyncSession, email_id: int):
        result = await db.execute(select(GeneratedEmail).where(GeneratedEmail.id == email_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, email: GeneratedEmail):
        db.add(email)
        await db.commit()
        await db.refresh(email)
        return email

    async def delete(self, db: AsyncSession, email_id: int):
        await db.execute(delete(GeneratedEmail).where(GeneratedEmail.id == email_id))
        await db.commit() 