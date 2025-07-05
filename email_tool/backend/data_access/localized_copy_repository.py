from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from ..models.localized_copy import LocalizedCopy

class LocalizedCopyRepository:
    async def get_by_template(self, db: AsyncSession, template_id: int):
        result = await db.execute(select(LocalizedCopy).where(LocalizedCopy.template_id == template_id))
        return result.scalars().all()

    async def get_by_project(self, db: AsyncSession, project_id: int):
        result = await db.execute(select(LocalizedCopy).where(LocalizedCopy.project_id == project_id))
        return result.scalars().all()

    async def get_by_project_and_locale(self, db: AsyncSession, project_id: int, locale: str):
        result = await db.execute(select(LocalizedCopy).where(
            LocalizedCopy.project_id == project_id,
            LocalizedCopy.locale == locale
        ))
        return result.scalars().all()

    async def get_by_project_locale_and_key(self, db: AsyncSession, project_id: int, locale: str, key: str):
        result = await db.execute(select(LocalizedCopy).where(
            LocalizedCopy.project_id == project_id,
            LocalizedCopy.locale == locale,
            LocalizedCopy.key == key
        ))
        return result.scalar_one_or_none()

    async def get(self, db: AsyncSession, copy_id: int):
        result = await db.execute(select(LocalizedCopy).where(LocalizedCopy.id == copy_id))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, copy: LocalizedCopy):
        db.add(copy)
        await db.commit()
        await db.refresh(copy)
        return copy

    async def update(self, db: AsyncSession, copy: LocalizedCopy):
        await db.commit()
        await db.refresh(copy)
        return copy

    async def delete(self, db: AsyncSession, copy_id: int):
        await db.execute(delete(LocalizedCopy).where(LocalizedCopy.id == copy_id))
        await db.commit()

    async def delete_by_project_locale_and_key(self, db: AsyncSession, project_id: int, locale: str, key: str):
        await db.execute(delete(LocalizedCopy).where(
            LocalizedCopy.project_id == project_id,
            LocalizedCopy.locale == locale,
            LocalizedCopy.key == key
        ))
        await db.commit()

    async def delete_by_project_and_locale(self, db: AsyncSession, project_id: int, locale: str):
        await db.execute(delete(LocalizedCopy).where(
            LocalizedCopy.project_id == project_id,
            LocalizedCopy.locale == locale
        ))
        await db.commit()

    async def bulk_create(self, db: AsyncSession, copies: list[LocalizedCopy]):
        db.add_all(copies)
        await db.commit()
        # Optionally refresh the first copy to ensure DB state
        if copies:
            await db.refresh(copies[0])
        return copies 