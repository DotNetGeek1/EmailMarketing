# Email Campaign Builder & Validator

This project provides a minimal foundation for a FastAPI backend,
a placeholder React frontend directory, and a Playwright test runner.
It follows the structure described in the repository README.

## Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Launch the API:
   ```bash
   uvicorn email_tool.backend.main:app --reload
   ```
3. (Optional) Run the Playwright test runner manually:
   ```bash
   python email_tool/playwright/test_runner.py path/to/email.html
   ```
