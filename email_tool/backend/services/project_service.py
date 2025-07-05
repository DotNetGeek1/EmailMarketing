from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models import Project, Template, LocalizedCopy, MarketingGroup
from ..data_access.project_repository import ProjectRepository
from ..data_access.template_repository import TemplateRepository
from ..data_access.localized_copy_repository import LocalizedCopyRepository
from typing import Optional, List, Dict, Any

class ProjectService:
    def __init__(self):
        self.project_repository = ProjectRepository()
        self.template_repository = TemplateRepository()
        self.localized_copy_repository = LocalizedCopyRepository()

    async def create_project(self, db: AsyncSession, name: str, customer_id: Optional[int] = None) -> Project:
        """Create a new project"""
        project = Project(
            name=name,
            customer_id=customer_id
        )
        return await self.project_repository.create(db, project)

    async def update_project(self, db: AsyncSession, project_id: int, name: str) -> Project | None:
        """Update project name"""
        project = await self.project_repository.get(db, project_id)
        if project:
            project.name = name
            return await self.project_repository.update(db, project)
        return None

    async def update_project_status(self, db: AsyncSession, project_id: int, status: str) -> Project | None:
        """Update project status"""
        project = await self.project_repository.get(db, project_id)
        if project:
            project.status = status
            return await self.project_repository.update(db, project)
        return None

    async def get_project(self, db: AsyncSession, project_id: int) -> Project | None:
        """Get a project by ID"""
        return await self.project_repository.get(db, project_id)

    async def get_projects(self, db: AsyncSession, customer_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all projects with template and copy counts using explicit joins"""
        # Get all projects
        projects = await self.project_repository.get_all(db)
        
        # Filter by customer_id if provided
        if customer_id is not None:
            projects = [p for p in projects if getattr(p, 'customer_id') == customer_id]
        
        # Get counts for each project using separate queries
        project_data = []
        for project in projects:
            # Get template count
            templates = await self.template_repository.get_by_project(db, getattr(project, 'id'))
            templates_count = len(templates)
            
            # Get unique locale count
            copies = await self.localized_copy_repository.get_by_project(db, getattr(project, 'id'))
            unique_locales = len(set(copy.locale for copy in copies))
            
            project_data.append({
                'id': project.id,
                'name': project.name,
                'created_at': project.created_at.isoformat(),
                'status': project.status,
                'customer_id': project.customer_id,
                'templates_count': templates_count,
                'languages_count': unique_locales
            })
        
        return project_data 