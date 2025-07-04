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

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Playwright browsers (for testing):**
   ```bash
   python -m playwright install
   ```

3. **Start the backend server:**
   ```bash
   cd email_tool/backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   cd email_tool/frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

### Database

The SQLite database (`db.sqlite3`) is automatically created when you first start the backend. All tables are created automatically based on the SQLAlchemy models.

---

## 📌 API Endpoints

### Campaigns
- `GET /api/campaigns` - Get all campaigns with template and language counts
- `POST /api/campaign` - Create a new campaign
- `PUT /api/campaign/{campaign_id}` - Update campaign name
- `DELETE /api/campaign/{campaign_id}` - Delete a campaign

### Templates
- `GET /api/templates` - Get all templates with campaign information
- `POST /api/template` - Upload HTML template
- `DELETE /api/template/{template_id}` - Delete a template
- `GET /api/placeholders/{template_id}` - Get placeholder keys for a template

### Copy Management
- `POST /api/copy/{campaign_id}/{language}` - Submit localized copy for a language

### Email Generation
- `POST /api/generate/{campaign_id}` - Generate localized HTML emails

### Testing
- `POST /api/test/{campaign_id}` - Run Playwright tests against generated HTMLs

### Tags
- `GET /api/tags` - Get all tags with campaign counts
- `POST /api/tags` - Create a new tag
- `PUT /api/tags/{tag_id}` - Update a tag
- `DELETE /api/tags/{tag_id}` - Delete a tag
- `POST /api/campaigns/{campaign_id}/tags/{tag_id}` - Add tag to campaign
- `DELETE /api/campaigns/{campaign_id}/tags/{tag_id}` - Remove tag from campaign

### API Documentation

When the backend is running, you can access:
- **Interactive API docs**: `http://localhost:8000/docs`
- **ReDoc documentation**: `http://localhost:8000/redoc`

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

Tag Management:
- Create and manage tags for organizing campaigns.
- Color-coded tags with descriptions.

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

Tag
  - id
  - name
  - color
  - description
  - created_at

campaign_tags (Many-to-Many)
  - campaign_id (FK)
  - tag_id (FK)

---

## 🛠 Development

### Backend Development

1. **Project Structure:**
   ```
   backend/
   ├── main.py              # FastAPI app entry point
   ├── data_access/
   │   └── database.py      # Database connection and initialization
   ├── models/              # SQLAlchemy models
   │   ├── base.py
   │   ├── campaign.py
   │   ├── template.py
   │   ├── tag.py
   │   └── ...
   ├── routers/
   │   └── api.py          # API endpoints
   └── services/           # Business logic
       ├── campaign_service.py
       ├── template_service.py
       └── ...
   ```

2. **Adding New Models:**
   - Create model in `models/` directory
   - Import in `main.py` to register with SQLAlchemy
   - Create corresponding service in `services/`

3. **Adding New Endpoints:**
   - Add to `routers/api.py`
   - Create corresponding service method
   - Update API documentation

### Frontend Development

1. **Project Structure:**
   ```
   frontend/
   ├── src/
   │   ├── components/     # Reusable UI components
   │   ├── pages/         # Page components
   │   ├── contexts/      # React contexts (theme, etc.)
   │   └── App.tsx        # Main app component
   ├── public/
   └── package.json
   ```

2. **Adding New Pages:**
   - Create page component in `src/pages/`
   - Add route in `App.tsx`
   - Add navigation item in `Sidebar.tsx`

### Testing

1. **API Testing:**
   ```bash
   cd email_tool
   python test_api.py
   ```

2. **Manual Testing:**
   - Use the sample template: `email_tool/sample_template.html`
   - Follow the testing guide: `email_tool/README_TESTING.md`

---

## 🚦 Roadmap

MVP:
- [x] FastAPI backend with models and endpoints
- [x] SQLite schema and migrations
- [x] React dashboard UI
- [x] Template parsing and copy storage
- [x] HTML generation logic
- [x] Playwright test runner with basic checks
- [x] Tag management system

Post-MVP Ideas:
- CSV/XLSX import/export for copy
- Live preview pane for templates
- Email rendering validation via 3rd party API
- User roles and access control (internal vs client)
- Change history or version control for copy

---

## 📂 Project Structure

```
email-tool/
├── backend/
│   ├── main.py
│   ├── data_access/
│   │   └── database.py
│   ├── models/
│   │   ├── base.py
│   │   ├── campaign.py
│   │   ├── template.py
│   │   ├── tag.py
│   │   └── ...
│   ├── routers/
│   │   └── api.py
│   └── services/
│       ├── campaign_service.py
│       ├── template_service.py
│       └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── contexts/
│   └── public/
├── playwright/
│   └── test_runner.py
├── sample_template.html
├── test_api.py
├── README_TESTING.md
├── db.sqlite3
├── requirements.txt
└── PROJECT.md
```

---

## 🤝 Contributors

Internal use only — contributions welcome from Engineering, Marketing Ops, and Localization teams.

---

## 📝 License

Internal tool - not for external distribution.
