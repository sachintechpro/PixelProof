# PixelProof QA evidence & defect decisions

This is a **real test management demonstration**, not a manufactured defect inventory. Two regressions were discovered during the v3.1 responsive audit and corrected. Unverified areas are listed as risks, not defects.

## Historical confirmed defects (regression verified)

| ID | Severity | Status | Actual observation | Correction | Evidence |
|---|---|---|---|---|---|
| PP-DEF-001 | High | Fixed / automated regression | Product quick-view backdrop appeared but product content/close control were invisible due to Bootstrap `.modal {display:none}` conflict | Scoped `.overlay .modal {display:block}` | `tests/mobile-ui.test.js` and v3.1 screenshots |
| PP-DEF-002 | High | Fixed / automated regression | Admin product Edit buttons required horizontal scrolling at 320px | Converted admin product table into stacked mobile product cards | `tests/mobile-ui.test.js` and v3.1 screenshots |

## Release-validation risks (not asserted failures)

| ID | Priority | Status | Why it matters | Required evidence |
|---|---|---|---|---|
| PP-RISK-001 | P0 | Open validation gap | Real iOS Safari + VoiceOver remains unverified | Real-device testing with screenshots and screen-reader notes |
| PP-RISK-002 | P0 | Known environment limitation | Render Free ephemeral JSON state loses orders on redeploy | Durable DB, backup/recovery and migration tests before production |
| PP-RISK-003 | P1 | Open validation gap | No documented concurrency/load test campaign | Defined load profile, latency/error budget and stock invariants |
| PP-RISK-004 | P1 | Open validation gap | No full WCAG 2.2 AA review | Axe + manual keyboard/screen-reader evidence |

**Gate:** CI green does not certify production readiness. Demo-only test credentials, simulated payments, fake shipping labels and ephemeral persistence mean this application must not handle actual customer orders.
