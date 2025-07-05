#!/usr/bin/env python3
"""
Database migration script to transition from Campaign -> Project structure
and add Marketing Groups.

This script will:
1. Create marketing_group table and populate with default groups
2. Create project table
3. Migrate data from campaign table to project table
4. Update all foreign key references
5. Drop old campaign table
"""

import asyncio
import sqlite3
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Base, MarketingGroup, Project
import os

# Database URL
DATABASE_URL = 'sqlite+aiosqlite:////app/db.sqlite3'

async def migrate_database():
    """Perform the database migration"""
    engine = create_async_engine(DATABASE_URL, future=True)
    
    async with engine.begin() as conn:
        print("Starting database migration...")
        
        # Step 1: Create marketing_group table
        print("1. Creating marketing_group table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS marketing_group (
                id INTEGER PRIMARY KEY,
                name VARCHAR NOT NULL,
                code VARCHAR NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Step 2: Populate marketing groups with default data
        print("2. Populating marketing groups...")
        default_groups = [
            ('D2C', 'D2C'),
            ('Creative Pro', 'CPro'),
            ('Consumer', 'CONS'),
            ('Gaming', 'Gam'),
            ('NAS', 'NAS'),
            ('Surveillance', 'SV'),
            ('Other (multiple POIs)', 'Other'),
            ('Seagate Partner', 'SPP'),
            ('Enterprise Drives', 'ED'),
            ('Lyve Cloud', 'LC'),
            ('Lyve Mobile', 'LM'),
            ('Systems', 'Sys'),
        ]
        
        for name, code in default_groups:
            await conn.execute(text("""
                INSERT OR IGNORE INTO marketing_group (name, code)
                VALUES (:name, :code)
            """), {"name": name, "code": code})
        
        # Step 3: Create project table
        print("3. Creating project table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS project (
                id INTEGER PRIMARY KEY,
                name VARCHAR NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR NOT NULL DEFAULT 'New',
                customer_id INTEGER,
                marketing_group_id INTEGER,
                FOREIGN KEY (customer_id) REFERENCES customer (id),
                FOREIGN KEY (marketing_group_id) REFERENCES marketing_group (id)
            )
        """))
        
        # Step 4: Create project_tags table
        print("4. Creating project_tags table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS project_tags (
                project_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (project_id, tag_id),
                FOREIGN KEY (project_id) REFERENCES project (id),
                FOREIGN KEY (tag_id) REFERENCES tag (id)
            )
        """))
        
        # Step 5: Check if campaign table exists and migrate data
        print("5. Checking for existing campaign table...")
        result = await conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='campaign'
        """))
        
        if result.fetchone():
            print("   Campaign table found. Migrating data...")
            
            # Migrate campaign data to project table
            await conn.execute(text("""
                INSERT INTO project (id, name, created_at, status, customer_id)
                SELECT id, name, created_at, status, customer_id
                FROM campaign
            """))
            
            # Migrate campaign_tags to project_tags
            await conn.execute(text("""
                INSERT INTO project_tags (project_id, tag_id)
                SELECT campaign_id, tag_id
                FROM campaign_tags
            """))
            
            # Update foreign key references in other tables
            print("   Updating foreign key references...")
            
            # Update template table
            await conn.execute(text("""
                ALTER TABLE template ADD COLUMN project_id INTEGER
            """))
            await conn.execute(text("""
                UPDATE template SET project_id = campaign_id
            """))
            await conn.execute(text("""
                ALTER TABLE template DROP COLUMN campaign_id
            """))
            
            # Update localized_copy table
            await conn.execute(text("""
                ALTER TABLE localized_copy ADD COLUMN project_id INTEGER
            """))
            await conn.execute(text("""
                UPDATE localized_copy SET project_id = campaign_id
            """))
            await conn.execute(text("""
                ALTER TABLE localized_copy DROP COLUMN campaign_id
            """))
            
            # Update generated_email table
            await conn.execute(text("""
                ALTER TABLE generated_email ADD COLUMN project_id INTEGER
            """))
            await conn.execute(text("""
                UPDATE generated_email SET project_id = campaign_id
            """))
            await conn.execute(text("""
                ALTER TABLE generated_email DROP COLUMN campaign_id
            """))
            
            # Drop old tables
            print("   Dropping old tables...")
            await conn.execute(text("DROP TABLE IF EXISTS campaign_tags"))
            await conn.execute(text("DROP TABLE IF EXISTS campaign"))
            
        else:
            print("   No campaign table found. Starting fresh.")
        
        print("Migration completed successfully!")
        
        # Verify the migration
        print("\nVerifying migration...")
        
        # Check project count
        result = await conn.execute(text("SELECT COUNT(*) FROM project"))
        project_count = result.scalar()
        print(f"   Projects: {project_count}")
        
        # Check marketing group count
        result = await conn.execute(text("SELECT COUNT(*) FROM marketing_group"))
        group_count = result.scalar()
        print(f"   Marketing Groups: {group_count}")
        
        # Check project_tags count
        result = await conn.execute(text("SELECT COUNT(*) FROM project_tags"))
        tags_count = result.scalar()
        print(f"   Project-Tag associations: {tags_count}")

if __name__ == "__main__":
    asyncio.run(migrate_database()) 