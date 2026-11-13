# PixelProof
### An interactive front-end engineering portfolio

**Built to the pixel. Proven in the browser.**

PixelProof is a responsive, interactive engineering showcase for a frontend developer role. It is not a collection of static screenshots or a slide deck: employers can use a working storefront, operate a connected commerce administration console, modify CSS on screen, interact with a real React component, exercise a jQuery API flow, and execute browser smoke checks.

![PixelProof overview](screenshots/home-desktop.png)

> **Live application:** [PixelProof on Render](https://pixelproof-m9ym.onrender.com/) · [Interactive QA Bench](https://pixelproof-m9ym.onrender.com/#/quality)
>
> **Source review:** See [Five-minute review guide](docs/REVIEW_GUIDE.md).
>
> **Responsive audit:** See [Mobile and tablet verification report](docs/RESPONSIVE_AUDIT.md).



## QA Lifecycle Workbench — requirements through release evidence

**[Open the enhanced Quality Bench](https://pixelproof-m9ym.onrender.com/#/quality)** · **[Five-minute QA portfolio walkthrough](qa/PORTFOLIO_WALKTHROUGH.md)**

The Quality Bench now includes six interactive lifecycle sections alongside the original 55-check runner: **Requirements**, **Test design**, **Manual execution**, **Automation**, **Defects & evidence**, and **QA reporting**. Eight risk-ranked requirements link to ten detailed manual test procedures and the existing 36 scenario-level cases. Visitors can author cases, record execution outcomes, attach screenshots/videos, log defects, and export leadership summaries. These manual records and attachments are stored **only in the visitor's browser**, not in a shared test management database.

Real Python/pytest/Selenium browser and API tests are available in [automation/python](automation/python), with an [isolated GitHub Actions workflow](.github/workflows/python-selenium.yml) and actual JUnit/screenshot artifacts on execution. A real [Postman API regression collection](automation/postman/PixelProof-API.postman_collection.json) is executed by [Newman in isolated CI](.github/workflows/postman-api.yml), producing actual assertion/JUnit evidence. The original 55 checks, Run All, category runs, individual runs, proof views and Reset remain intact. Manual entries are labeled tester-entered; the page never substitutes them for automatically verified results. Destructive browser tests use isolated demo data, not the publicly shared storefront.

## Interactive QA Bench (v3.3) — run tests yourself

**[Open the live Quality Bench](https://pixelproof-m9ym.onrender.com/#/quality)**.

The Quality Bench retains the original direct **Run tests / Pass / Fail / Not run** structure, now with **55 user-executable checks** across four risk-based categories:

- **Unit (14)** — pricing, SKU validation, category/search/sort, stock arithmetic and cancellation.
- **SIT (15)** — connected checkout, declined payments, admin overview, stock reservation, label creation, dispatch and negative integration paths.
- **UAT (14)** — customer-to-fulfillment business journeys (10 server-side workflows and 4 real browser DOM/viewport checks).
- **Production (12)** — actual read-only/rejection-path HTTP calls against the active app (health, catalog, search, styles, SVG, authorization denial, deliberate 503, 404).

**Run All**, **Run category**, **Run one**, **View proof**, and **Reset results** are available directly in the browser. Results always start **Not run**, and pass/fail counters only reflect the user's current execution. Proof includes test input, expected assertion, actual backend result or real HTTP status/body, and elapsed time. Reset clears this browser's test results, not the shared fictional store.

Unit/SIT/most UAT checks execute the actual Node commerce functions against **fresh in-memory synthetic fixtures**. They do not send actual checkout HTTP requests or write shared store data. Production checks send genuine HTTP requests, but only safe GET operations. The result cards identify these two evidence types explicitly; the bench does not claim actual payments, postage, shipping, accessibility certification, physical iPhone validation or live database persistence.

The build regression suite (`npm run check`) remains separate and generates `public/qa-ci-results.json` from actual TAP test output. These historical build results are never substituted for a visitor's on-demand test run.

## Admin demo login (v3.1)

From the top navigation, choose **Admin login** or go directly to `/#/admin`.
The login screen intentionally displays the public demonstration credentials:

- **User ID:** `demo.admin`
- **Password:** `PixelProof@2026`

Use **Use these demo credentials** to populate the fields, then select **Sign in to admin console**. A successful login opens the connected products, inventory and order-processing dashboard. **Sign out** revokes the session. All `/api/admin/` data endpoints require a server-side, time-limited session. Demo credentials are public by design and **must not be used to protect production data**.

## Try the customer → business-owner journey

1. **Customer:** Open `/#/store` and add any fictional product to the bag. Continue to `/#/checkout` and use **Fill all fictional test details**, or type the published test details below.
2. **Demo payment:** Test Visa `4242 4242 4242 4242`, expiry `12/30`, CVC `123`; alternate declined test number `4000 0000 0000 0002`. Real card details are **never accepted, transmitted, charged or stored**. The server only receives an approved/declined symbolic token.
3. **Confirmation:** A `PP-...` order is created with server-authoritative prices, reserved inventory, a fictional shipping address, and a demo authorization reference.
4. **Business owner:** Open `/#/admin`, sign in with public demo credentials above, select **Order processing**, and expand the new order. Orders are shared across visitor browsers.
5. **Label and dispatch:** Select **Generate shipping label**, view/print the prominently invalid demonstration label, enter its generated `DEMO-LBL-...` reference, then select **Mark dispatched**. Wrong references are rejected. Finally select **Mark delivered**.
6. **Exceptions:** Try out-of-stock checkout, a declined test payment, cancelling before dispatch (inventory restored), or the seeded **On Hold** order (replenish stock and recheck).

See [the journey and limitations](docs/REAL_COMMERCE_JOURNEY.md) for API paths and deployment guidance.

## Five interactive modules

| Module | What to try | Implementation evidence |
|---|---|---|
| **Storefront** | Search, filter, sort, product quick view, shopping bag, persistent quantities, full demo checkout (fictional details + test card), order confirmation | `public/app.js`, `server.js`, `data.js` |
| **Design studio** | Responsive preview, adjustable design tokens, grid overlay, CSS export, design handoff SVG | `public/styles.css`, `public/assets/design-brief.svg` |
| **Interaction lab** | jQuery AJAX search with error states, custom plugin, React feature configurator, validation, Bootstrap grid | `public/jquery.characterBudget.js`, `public/react-lab.js` |
| **Quality bench** | Run six live checks against API, assets, responsive rules, semantics | `public/app.js`, `tests/server.test.js`, `.github/workflows/ci.yml` |
| **Commerce admin** | Create and edit products, optimize product images, manage visibility/SKU/inventory, print fictional labels, verify references, dispatch individual orders, cancel with restocking, reset shared demo | `public/admin.js`, `commerce.js`, `server.js`, `tests/commerce.test.js` |

![Storefront](screenshots/store-desktop.png)

## QA Command Center — risk-based evidence (v3.2)

The **Quality bench** now includes an eight-level test strategy, real automated test results generated on each build, a searchable test case inventory, a 16-check read-only live browser smoke suite, confirmed regression defects, explicit validation gaps, and a conditional release decision. It does **not** count manual test plans as passing or claim production/iOS accessibility certification.

- **[Open the live Quality Bench](https://pixelproof-m9ym.onrender.com/#/quality)**
- **[Test strategy and release gates](qa/TEST_STRATEGY.md)**
- **[Confirmed defects and validation risks](qa/DEFECTS.md)**
- **[Manual / exploratory case matrix](qa/manual-cases.json)**
- **[CI runs](https://github.com/sachintechpro/PixelProof/actions)**

Run `npm run check` to execute actual Node tests and generate `public/qa-ci-results.json`. Render runs this command at deployment time, so the visible dashboard references deployment build evidence. Test outcomes and counts are not hardcoded.

## Technologies demonstrated

**HTML5:** semantic landmarks, accessible form labels, native inputs, disclosure components.

**CSS3:** CSS Grid, Flexbox, variables, transitions, responsive media queries, reduced-motion support, custom control styling.

**JavaScript ES6+:** modern DOM APIs, arrow functions, template literals, async/await, Fetch, localStorage, debounced UI, error handling.

**jQuery:** real `$.ajax` calls to a Node API, event namespace management, and a reusable `$.fn.characterBudget` plugin.

**React:** actual stateful React component that computes totals using React state, isolated from jQuery-owned DOM.

**Bootstrap 5:** a real utility-based responsive grid in the Interaction Lab.

**Browser debugging:** real HTTP status codes (200, 422, 503), Chrome DevTools-compatible network paths, a user-triggered smoke test runner.

**Version control / automation:** repository-ready source layout, `.gitignore`, and a GitHub Actions workflow running syntax and API tests.

**eCommerce interface:** connected product CRUD, browser-side image optimization, inventory reservations, fictional checkout with browser-only test-card validation and a symbolic payment token, cross-browser order queue, printable sample shipping labels, dispatch validation, and order history. No real payment gateway or shipping API is connected.

**Images:** original local SVG product illustrations, `loading="lazy"` where appropriate, explicit dimensions on product images.

## Architecture

```
Browser (HTML5 + CSS3 + ES6+ JavaScript + jQuery + React + Bootstrap)
              |
              | Fetch / $.ajax
              v
      Node.js HTTP server
              |
              +-- GET /api/health
              +-- GET /api/products?category=Audio&sort=price-asc&q=
              +-- GET /api/suggest?q=lamp
              +-- GET /api/suggest?q=lamp&simulate=error  [returns HTTP 503]
              +-- POST /api/orders                     [sample order + stock reservation]
              +-- GET /api/admin/overview
              +-- GET/POST /api/admin/products
              +-- PATCH/DELETE /api/admin/products/:id
              +-- GET /api/admin/orders
              +-- PATCH /api/admin/orders/:id           [valid fulfillment transitions]
              +-- POST /api/admin/orders/:id/label      [generate sample shipping label]
              +-- GET  /api/admin/orders/:id/label      [view/print label]
              +-- POST /api/admin/orders/:id/dispatch   [verify label, mark dispatched]
              +-- POST /api/admin/orders/:id/recheck    [retry held inventory]
              +-- POST /api/admin/reset                [reset shared fictional store]
              +-- Shared JSON fictional store (server-side, across browsers)
              +-- Static assets + JS/CSS (locally served)
```

This app intentionally uses **zero third-party npm runtime dependencies**; React, jQuery, and Bootstrap assets are locally bundled. The React demonstration uses a small stateful component and the rest showcases native JS fundamentals. It is not intended to represent a production React/Vite project.

## Start locally

Requires **Node.js 20 or later**.

```bash
node server.js
```

Visit http://localhost:3000.

Run automated API tests and syntax verification:

```bash
npm test
npm run check
```

There is no `npm install` step and no API keys. Local data is sample-only. By default the backend uses one **shared fictional storefront and order queue** saved under `.local-data/` (excluded from Git). Set `PIXELPROOF_ISOLATED=true` only for isolated test workspaces. You can override its directory with `PIXELPROOF_DATA_DIR`. The `PORT` environment variable is respected for deployment. **On Render Free, filesystem storage is ephemeral and may reset after restart/redeploy**; permanent production storage requires a durable database or persistent disk.

## Deploy on Render

1. Use the public GitHub repository `sachintechpro/PixelProof`, and upload the **contents of this updated folder** to its root, replacing matching existing files. Make sure `server.js`, `commerce.js`, `package.json`, `public/`, `.github/`, and `render.yaml` are at the root.
2. Open the **existing** PixelProof Render service (`pixelproof-m9ym.onrender.com`) — do not create another service.
3. In Render **Settings**, set **Root Directory: blank**. This is essential: the repository also contains a stale `PixelProof/` subfolder that would otherwise deploy the older application. Keep **Runtime: Node**, **Build Command: `npm run check`**, **Start Command: `node server.js`**, and **Health Check Path: `/api/health`**.
4. Save settings and deploy the latest `main` commit. Confirm `GET /api/health` responds with `version: "3.1.0"` before using the new checkout and admin workflow.

Alternatively, Render can read the included `render.yaml` as a Blueprint. Keep the repository contents at the root when using the Blueprint.

To publish with git from an extracted folder:

```bash
git init
git add .
git commit -m "Add connected commerce administration console"
git branch -M main
git remote add origin https://github.com/sachintechpro/PixelProof.git
git push -u origin main
```

If the remote repository already has commits, clone it first and copy the updated project files into that clone before committing and pushing. Do not force-push or overwrite unrelated work.

## Important integrity notes

- Sample products and checkout are **demonstrations**. The server validates orders and prices, records a **fictional order** in a shared JSON workspace, and reserves/restores inventory as needed. Checkout accepts ONLY synthetic email domains and test card details. The browser validates card input and sends a symbolic token, never the card number/CVC/expiry. No real charges, emails, labels, carrier shipment or real order fulfillment occur. Synthetic order details are retained for the fake shipping label.
- The admin console uses a **publicly displayed demonstration login** and is not appropriate for real business data. All visitors interact with the same fictional catalog and order queue, so use only synthetic information. A production service needs private authentication, authorization, a durable database, concurrency-safe transactions, audit controls and licensed payment/carrier integrations.
- **Render Free storage is ephemeral.** The shared JSON data survives normal page reloads but cannot be promised across redeploys or instance replacement.
- The design handoff reference is an **original SVG**, not a supplied Photoshop PSD. This project does not assert Photoshop, Illustrator, or Fireworks work experience.
- The in-browser checks do **not** prove testing in Firefox, Safari, or Edge. See the [manual QA plan](docs/MANUAL_QA.md) for an honest cross-browser test matrix.
- Preferred but unimplemented platforms (WordPress, Shopify, BigCommerce, Magento, PHP, MySQL) are intentionally not presented as integrated systems.
- AI-assisted coding may accelerate development; review and validation of generated work remain necessary. This repository includes testable code rather than claims of AI proficiency.

## Commerce admin walkthrough

See [Commerce admin technical guide](docs/COMMERCE_ADMIN.md) for API, validation, and storage design, and [Five-minute review guide](docs/REVIEW_GUIDE.md) for an employer-friendly demonstration.

## Screenshots

| Desktop | Mobile |
|---|---|
| ![Overview desktop](screenshots/home-desktop.png) | ![Overview mobile](screenshots/home-mobile.png) |

## License

MIT. The local third-party frontend bundles retain their upstream licensing; see vendor versions below. Original SVG illustrations are created for this project.

**Locally bundled libraries:** jQuery 3.6.x, React 16.0.x, ReactDOM 16.0.x, Bootstrap CSS 5.1.1. All are under their respective MIT licenses. For a new production application, update these dependencies to their currently supported stable versions and use a modern bundler.

## Featuring PixelProof on your profile

After uploading and deploying, see [GitHub profile instructions](docs/GITHUB_PROFILE.md) to pin the project and add the live URL to your profile README.
