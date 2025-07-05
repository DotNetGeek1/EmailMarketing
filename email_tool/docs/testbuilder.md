# 🧪 TEST_BUILDER.md

## 📋 Feature: Playwright Test Builder

This document defines the design and implementation of a **Playwright Test Builder** that allows users to define functional UI tests against generated HTML email templates using structured inputs such as spreadsheets or a web form. The generated tests are automatically executed using Playwright and test results are reported in the web interface.

---

## 🎯 Goals

- Provide a no-code or low-code interface for defining UI tests.
- Leverage `data-testid` attributes in templates for stable selectors.
- Allow import of test definitions via spreadsheet (CSV/XLSX) or JSON.
- Convert test steps into executable Playwright Python scripts.
- Run tests automatically against generated HTML emails.
- Display test results, logs, and optional screenshots.

---

## 🧩 Key Concepts

- **Test Step**: A single interaction or assertion in a sequence (e.g., click, expect text, check URL).
- **Test Scenario**: A complete list of test steps representing a single use case.
- **Selector**: Typically a `data-testid` value in the HTML used for targeting elements.
- **Generated HTML**: The rendered email under test, accessed via local server or file URL.

---

## 📂 Example Use Case

```text
Test Scenario: "Demo signup email flow"

1. Click the “Get Started” button → [data-testid=start-button]
2. Expect a welcome message appears → [data-testid=welcome-msg]
3. Click the next page → [data-testid=pagination-next]
4. Assert page number field has value = 2 → [data-testid=page-number]
5. Click product link → [data-testid=product-link]
6. Assert that the URL contains "/product-details"
```

---

## 🗃 Test Step Format (Internal JSON)

```json
[
  {
    "action": "click",
    "selector": "start-button"
  },
  {
    "action": "expectText",
    "selector": "welcome-msg",
    "value": "Thanks for signing up!"
  },
  {
    "action": "expectAttr",
    "selector": "page-number",
    "attr": "value",
    "value": "2"
  },
  {
    "action": "click",
    "selector": "product-link"
  },
  {
    "action": "expectUrlContains",
    "value": "/product-details"
  }
]
```

---

## 🔧 Supported Actions (v1)

| Action              | Parameters                         | Description                              |
|---------------------|-------------------------------------|------------------------------------------|
| `click`             | `selector`                         | Click element with the given `data-testid` |
| `expectText`        | `selector`, `value`                | Assert element contains text              |
| `expectAttr`        | `selector`, `attr`, `value`        | Assert element has attribute with value   |
| `expectUrlContains` | `value`                            | Assert current URL contains string        |
| `waitForSelector`   | `selector`                         | Wait for element to appear                |
| `fill`              | `selector`, `value`                | Fill input field                          |

---

## 📤 Input Formats

### ✅ JSON (Native Format)
Can be submitted directly via API or Web UI.

### ✅ Spreadsheet (CSV/XLSX)
**Columns**: `step`, `action`, `selector`, `value`, `attr` (optional)

| step | action           | selector        | value                   | attr    |
|------|------------------|------------------|-------------------------|---------|
| 1    | click            | start-button     |                         |         |
| 2    | expectText       | welcome-msg      | Thanks for signing up!  |         |
| 3    | expectAttr       | page-number      | 2                       | value   |
| 4    | click            | product-link     |                         |         |
| 5    | expectUrlContains|                  | /product-details        |         |

---

## 🛠 Test Code Generation

Backend script will transform each test scenario into a runnable **Playwright Python script**:

### Example Output:

```python
def test_scenario(page):
    page.goto("file:///path/to/generated/email.html")

    page.click('[data-testid="start-button"]')
    assert "Thanks for signing up!" in page.text_content('[data-testid="welcome-msg"]')

    assert page.get_attribute('[data-testid="page-number"]', 'value') == "2"

    page.click('[data-testid="product-link"]')
    assert "/product-details" in page.url
```

Optional:
- Add screenshot on failure
- Add timing logs or retries

---

## 🧱 Directory Layout

```text
playwright-tests/
├── scenarios/
│   └── campaign_123_test1.json        # Stored test steps
├── scripts/
│   └── campaign_123_test1.py          # Generated Python code
├── results/
│   └── campaign_123_test1_result.json # Result output
├── runner.py                          # Test execution manager
```

---

## 📡 API Endpoints (Proposal)

### POST `/test-builder/import`
Upload test steps from CSV or JSON

### POST `/test-builder/generate`
Generate test script from scenario ID

### POST `/test-builder/run`
Run a test for a campaign/template

### GET `/test-builder/results/{campaign_id}`
Retrieve results (pass/fail, logs, errors)

---

## 🖥 UI Builder Interface (v2+)

- "Add Test Scenario" form
- Step-by-step builder: dropdown for actions
- Autocomplete/select `data-testid` from uploaded HTML
- Preview steps as JSON before running
- Upload spreadsheet for bulk test definition

---

## ✅ Implementation Roadmap

### Phase 1: Backend (MVP)
- [ ] Parse spreadsheet or JSON to internal format
- [ ] Generate Playwright test file
- [ ] Execute test and capture output (pass/fail, logs)
- [ ] Store and serve results

### Phase 2: Frontend
- [ ] Form builder for test steps
- [ ] Spreadsheet uploader
- [ ] Test preview, run, and status UI

### Phase 3: Enhancements
- [ ] Screenshot capture on failure
- [ ] Retry strategy or delay handling
- [ ] Reusable test step templates
- [ ] Group tests by campaign/template

---

## 🧩 Related Features

- `email-generator`: Generates HTML to be tested
- `data-testid` enforcement in template uploader
- GPT + Copy validation (can be combined with UX tests)

---

## 📎 Notes

- Requires testable HTML pages (served locally or via test URL)
- `data-testid` is mandatory for all interactive or testable elements
- Screenshots/logs should be accessible via dashboard for failed tests

---

## 👥 Contributors

Engineering QA, Frontend Devs, Campaign Ops
