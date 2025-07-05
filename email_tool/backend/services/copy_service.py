from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from ..models import Project, LocalizedCopy
from ..data_access.project_repository import ProjectRepository
from ..data_access.localized_copy_repository import LocalizedCopyRepository


class CopyService:
    """Manage localized copy blocks."""

    def __init__(self):
        self.project_repository = ProjectRepository()
        self.localized_copy_repository = LocalizedCopyRepository()

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
        project = await self.project_repository.get(db, project_id)
        if not project:
            return None
        
        # Check if copy entry already exists
        existing_copy = await self.localized_copy_repository.get_by_project_locale_and_key(
            db, project_id, locale, key
        )
        
        if existing_copy:
            # Update existing entry
            existing_copy.value = value
            existing_copy.status = status
            return await self.localized_copy_repository.update(db, existing_copy)
        else:
            # Create new entry
            copy = LocalizedCopy(
                project_id=project_id,
                locale=locale,
                key=key,
                value=value,
                status=status
            )
            return await self.localized_copy_repository.create(db, copy)

    async def update_copy_status(
        self,
        db: AsyncSession,
        copy_id: int,
        status: str
    ) -> bool:
        copy = await self.localized_copy_repository.get(db, copy_id)
        if not copy:
            return False
        copy.status = status
        await self.localized_copy_repository.update(db, copy)
        return True

    async def delete_copy(
        self,
        db: AsyncSession,
        project_id: int,
        locale: str,
        key: str,
    ) -> bool:
        """Delete a specific copy entry"""
        await self.localized_copy_repository.delete_by_project_locale_and_key(db, project_id, locale, key)
        return True

    async def delete_copies_for_locale(
        self,
        db: AsyncSession,
        project_id: int,
        locale: str,
    ) -> int:
        """Delete all copy entries for a specific locale in a project"""
        await self.localized_copy_repository.delete_by_project_and_locale(db, project_id, locale)
        return 1  # Repository doesn't return row count, so we assume success

    async def get_copies(self, db: AsyncSession, project_id: int) -> list[LocalizedCopy]:
        """Get all copy entries for a project"""
        copies = await self.localized_copy_repository.get_by_project(db, project_id)
        return list(copies)

    async def get_copies_by_locale(
        self, 
        db: AsyncSession, 
        project_id: int, 
        locale: str
    ) -> list[LocalizedCopy]:
        """Get all copy entries for a specific locale in a project"""
        copies = await self.localized_copy_repository.get_by_project_and_locale(db, project_id, locale)
        return list(copies)

    async def get_copies_by_template(
        self, 
        db: AsyncSession, 
        project_id: int, 
        template_id: int
    ) -> list[LocalizedCopy]:
        """Get all copy entries for a specific template"""
        copies = await self.localized_copy_repository.get_by_template(db, template_id)
        return list(copies)

    async def create_copy(
        self,
        db: AsyncSession,
        project_id: int,
        template_id: int,
        placeholder_name: str,
        copy_text: str,
        locale: str,
        status: str = 'Draft'
    ) -> LocalizedCopy | None:
        """Create a new copy entry for a template"""
        copy = LocalizedCopy(
            project_id=project_id,
            template_id=template_id,
            key=placeholder_name,
            value=copy_text,
            locale=locale,
            status=status
        )
        return await self.localized_copy_repository.create(db, copy)

    async def bulk_create_copies(
        self,
        db: AsyncSession,
        items: list[dict]
    ) -> list[LocalizedCopy]:
        copies = []
        for item in items:
            copy = LocalizedCopy(
                project_id=item['project_id'],
                template_id=item['template_id'],
                key=item['placeholder_name'],
                value=item['copy_text'],
                locale=item['locale'],
                status=item.get('status', 'Draft')
            )
            copies.append(copy)
        return await self.localized_copy_repository.bulk_create(db, copies)

