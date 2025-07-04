 # Email Campaign Builder & Validator

An internal web tool to manage multilingual email campaigns using HTML templates with dynamic placeholders. Designed for in-house teams, with optional client-provided copy.

---

## 🎯 Goals

- Upload and manage HTML email templates with placeholders.
- Manage copy blocks per language and campaign.
- Generate localized HTML emails.
- Validate output using Playwright (placeholder correctness, URLs, etc.).
- Provide a clean web interface for managing everything.

---

## 🏗 Tech Stack

Backend:        Python + FastAPI  
Frontend:       React + Tailwind CSS  
Templating:     Jinja2  
Database:       SQLite (can upgrade to PostgreSQL)  
Testing:        Playwright (Python)  
Authentication: Simple token or internal SSO (TBD)

---

## 🧩 Core Features (MVP)

Campaigns:
- Create/edit campaigns.
- Associate templates and languages.

Template Management:
- Upload HTML with placeholders (e.g., {{headline}}).
- Extract and store placeholder keys.

Copy Localization:
- Enter or upload copy per language.
- Map copy values to placeholder keys.

HTML Generation:
- Render localized HTML per language.
- Store and export generated emails.

 Playwright Testing:
 - Validate placeholder substitution and missing links via Playwright.
 - Optional: Validate visible copy text.

---

## 🗂 Database Overview

Campaign
  - id
  - name
  - created_at

Template
  - id
  - campaign_id (FK)
  - filename
  - content (HTML)
  - created_at

Placeholder
  - id
  - template_id (FK)
  - key (e.g., {{headline}})
  - created_at

LocalizedCopy
  - id
  - campaign_id (FK)
  - language
  - key
  - value

GeneratedEmail
  - id
  - campaign_id (FK)
  - language
  - html_content
  - generated_at

PlaywrightResult
  - id
  - generated_email_id (FK)
  - passed (boolean)
  - issues (JSON blob)
  - tested_at

---

## 📌 API Overview

POST   /campaign
  - Create a new campaign.

PUT    /campaign/{campaign_id}
  - Update an existing campaign name.

POST   /template
  - Upload HTML template.

GET    /placeholders/{template_id}
  - Retrieve list of placeholder keys.

POST   /copy/{campaign_id}/{language}
  - Submit localized copy for a language.

POST   /generate/{campaign_id}
  - Generate localized HTML emails.

POST   /test/{campaign_id}
  - Run Playwright tests against generated HTMLs.

---

## 🚦 Roadmap

MVP:
- [ ] FastAPI backend with models and endpoints
- [ ] SQLite schema and migrations
- [ ] React dashboard UI
- [ ] Template parsing and copy storage
- [ ] HTML generation logic
- [ ] Playwright test runner with basic checks

Post-MVP Ideas:
- CSV/XLSX import/export for copy
- Live preview pane for templates
- Email rendering validation via 3rd party API
- User roles and access control (internal vs client)
- Change history or version control for copy

---

## 📂 Project Structure

email-tool/
├── backend/
│   ├── main.py
│   ├── data_access/
│   │   └── database.py
│   ├── models/
│   │   ├── base.py
│   │   └── *.py
│   ├── routers/
│   │   └── api.py
│   └── services/
│       └── *.py
├── frontend/
│   ├── src/
│   └── public/
├── playwright/
│   └── test_runner.py
├── db.sqlite3
├── requirements.txt
└── PROJECT.md

---

## 🤝 Contributors

Internal use only — contributions welcome from Engineering, Marketing Ops, and Localization teams.
