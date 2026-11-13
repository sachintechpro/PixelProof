# QA lifecycle portfolio — five-minute hiring manager walkthrough

**Live:** https://pixelproof-m9ym.onrender.com/#/quality
**Application under test:** https://pixelproof-m9ym.onrender.com/#/store
**Automation CI:** https://github.com/sachintechpro/PixelProof/actions

The Quality Bench has two complementary areas:

1. **QA Lifecycle Workbench (new):** requirements, test design, manual execution, evidence/defects, automation references and reporting.
2. **Existing technical runner (unchanged):** 55 executable Unit/SIT/UAT/Production checks showing inputs, actual response/assertions, elapsed time and failures. Production category only invokes safe GET/rejection paths; Unit/SIT mostly invoke isolated business logic.

## Suggested walkthrough

1. Open **Requirements**, choose REQ-03 (checkout) or REQ-05 (fulfillment). Inspect acceptance criteria, unresolved product-owner questions, P0 risk and linked test IDs.
2. Open **Test design** and inspect TC-03/04 (approved/declined synthetic checkout) or TC-06/07 (shipping label and invalid-reference rejection). Each detailed case shows preconditions, fictional test data, steps and expected result. The other 36 preexisting coverage scenarios are clearly marked as outlines.
3. Open **Manual execution**, choose a test, perform its steps in the live demo using **fictional data only**, enter your actual observations, select Passed/Failed/Blocked and save. Use the file input to attach a screenshot, video, log or JSON response. Evidence remains in that browser's IndexedDB. **Manual results are human-entered, not independently verified.** Do not conduct destructive/concurrent testing on the shared Render storefront.
4. Open **Automation**. Inspect Selenium/pytest source in automation/python, plus existing Node API/business-rule tests. Select the runner link to execute safe live checks and inspect actual backend proof. GitHub Actions performs Python browser tests against an **isolated local test instance**, not the shared public demo.
5. Open **Defects & evidence**. Record a defect with reproduction steps, link to a case, classify severity, attach screenshots/recordings and track retest status.
6. Open **QA reporting**. Inspect only actually recorded outcomes, unresolved defects and conditional release risks. Export JSON or CSV for stakeholder review.

## Traceability and evidence integrity

- Eight portfolio requirements are explicitly described as **representative specifications**, not client-approved requirements.
- Ten detailed author-written test procedures have preconditions, step-by-step actions, synthetic data and expected outcomes. The preexisting manual test matrix contributes 36 scenario-level planned checks.
- Manual records are saved in browser localStorage; attachments in browser IndexedDB. They **are not uploaded or synced**. Clearing site data removes them, so download reports and retain evidence externally as needed.
- Node build tests produce actual TAP results and generated JSON. The browser runner only assigns pass/fail on execution.
- Python Selenium tests use pytest and Chrome, create screenshots on failure and upload JUnit XML through Actions.
- A **Conditional / showcase-only** recommendation remains until physical device, accessibility, concurrency, resilience, security and durable storage gates are evidenced. No real transactions, shipping or production certification are claimed.

## Python automation setup

With Node 22 and Python 3.12+:

    python -m pip install -r automation/python/requirements.txt
    PIXELPROOF_ISOLATED=true PORT=3000 node server.js
    # In another terminal:
    PIXELPROOF_BASE_URL=http://127.0.0.1:3000 python -m pytest automation/python -v

When run in GitHub Actions, the workflow provisions Chrome, starts an isolated PixelProof service and uploads real test artifacts. No third-party payment or shipping service is called.
