import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from .database import get_db
from ..models.marketing_group_type import MarketingGroupType
from .marketing_group_repository import MarketingGroupRepository

# Predefined marketing group types from the documentation
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

async def seed_marketing_group_types():
    """Seed the database with predefined marketing group types"""
    repository = MarketingGroupRepository()
    
    async for db in get_db():
        try:
            print("Starting to seed marketing group types...")
            
            # Check if types already exist
            existing_types = await repository.get_all_types(db)
            existing_codes = {t.code for t in existing_types}
            
            created_count = 0
            skipped_count = 0
            
            for type_data in MARKETING_GROUP_TYPES:
                if type_data["code"] not in existing_codes:
                    group_type = MarketingGroupType(
                        label=type_data["label"],
                        code=type_data["code"]
                    )
                    await repository.create_type(db, group_type)
                    created_count += 1
                    print(f"Created marketing group type: {type_data['label']} ({type_data['code']})")
                else:
                    skipped_count += 1
                    print(f"Skipped existing marketing group type: {type_data['label']} ({type_data['code']})")
            
            print(f"\nSeeding completed!")
            print(f"Created: {created_count} new types")
            print(f"Skipped: {skipped_count} existing types")
            print(f"Total: {len(existing_types) + created_count} types in database")
            
        except Exception as e:
            print(f"Error seeding marketing group types: {e}")
            raise
        finally:
            break

async def main():
    """Main function to run the seeding script"""
    await seed_marketing_group_types()

if __name__ == "__main__":
    asyncio.run(main()) 