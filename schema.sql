CREATE TABLE marketing_group_type (
    id SERIAL PRIMARY KEY,
    label VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'New',
    customer_id INTEGER
);

CREATE TABLE marketing_group (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES project(id),
    marketing_group_type_id INTEGER NOT NULL REFERENCES marketing_group_type(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uix_project_group_type UNIQUE (project_id, marketing_group_type_id)
);

-- Add other tables as needed (template, tag, etc.) 