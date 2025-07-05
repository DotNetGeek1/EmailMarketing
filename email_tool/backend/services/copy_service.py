from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ..models import Project, LocalizedCopy


class CopyService:
    """Manage localized copy blocks."""

    async def submit_copy(
        self,
        db: AsyncSession,
        project_id: int,
        locale: str,
        key: str,
        value: str,
        status: str = 'Draft',
    ) -> LocalizedCopy | None:
        """Submit or update a copy entry (upsert operation)"""
        project = await db.get(Project, project_id)
        if not project:
            return None
        
        # Check if copy entry already exists
        existing_copy = await db.execute(
            select(LocalizedCopy).filter_by(
                project_id=project_id,
                locale=locale,
                key=key
            )
        )
        existing_copy = existing_copy.scalar_one_or_none()
        
        if existing_copy:
            # Update existing entry
            existing_copy.value = value
            existing_copy.status = status
            await db.commit()
            await db.refresh(existing_copy)
            return existing_copy
        else:
            # Create new entry
            copy = LocalizedCopy(
                project_id=project_id,
                locale=locale,
                key=key,
                value=value,
                status=status
            )
            db.add(copy)
            await db.commit()
            await db.refresh(copy)
            return copy

    async def update_copy_status(
        self,
        db: AsyncSession,
        copy_id: int,
        status: str
    ) -> bool:
        copy = await db.get(LocalizedCopy, copy_id)
        if not copy:
            return False
        copy.status = status
        await db.commit()
        return True

    async def delete_copy(
        self,
        db: AsyncSession,
        project_id: int,
        locale: str,
        key: str,
    ) -> bool:
        """Delete a specific copy entry"""
        result = await db.execute(
            delete(LocalizedCopy).filter_by(
                project_id=project_id,
                locale=locale,
                key=key
            )
        )
        await db.commit()
        return result.rowcount > 0

    async def delete_copies_for_locale(
        self,
        db: AsyncSession,
        project_id: int,
        locale: str,
    ) -> int:
        """Delete all copy entries for a specific locale in a project"""
        result = await db.execute(
            delete(LocalizedCopy).filter_by(
                project_id=project_id,
                locale=locale
            )
        )
        await db.commit()
        return result.rowcount

    async def get_copies(self, db: AsyncSession, project_id: int) -> list[LocalizedCopy]:
        """Get all copy entries for a project"""
        result = await db.execute(
            select(LocalizedCopy).filter_by(project_id=project_id)
        )
        return list(result.scalars().all())

    async def get_copies_by_locale(
        self, 
        db: AsyncSession, 
        project_id: int, 
        locale: str
    ) -> list[LocalizedCopy]:
        """Get all copy entries for a specific locale in a project"""
        result = await db.execute(
            select(LocalizedCopy).filter_by(
                project_id=project_id,
                locale=locale
            )
        )
        return list(result.scalars().all())

