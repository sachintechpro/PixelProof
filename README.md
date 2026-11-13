# PixelProof
### An interactive front-end engineering portfolio

**Built to the pixel. Proven in the browser.**

PixelProof is a responsive, interactive engineering showcase for a frontend developer role. It is not a collection of static screenshots or a slide deck: employers can use a working storefront, operate a connected commerce administration console, modify CSS on screen, interact with a real React component, exercise a jQuery API flow, and execute browser smoke checks.

![PixelProof overview](screenshots/home-desktop.png)

> **Live URL:** Add your Render deployment URL here after publishing.
>
> **Source review:** See [Five-minute review guide](docs/REVIEW_GUIDE.md).

## Five interactive modules

| Module | What to try | Implementation evidence |
|---|---|---|
| **Storefront** | Search, filter, sort, product quick view, shopping bag, persistent quantities, sample checkout | `public/app.js`, `server.js`, `data.js` |
| **Design studio** | Responsive preview, adjustable design tokens, grid overlay, CSS export, design handoff SVG | `public/styles.css`, `public/assets/design-brief.svg` |
| **Interaction lab** | jQuery AJAX search with error states, custom plugin, React feature configurator, validation, Bootstrap grid | `public/jquery.characterBudget.js`, `public/react-lab.js` |
| **Quality bench** | Run six live checks against API, assets, responsive rules, semantics | `public/app.js`, `tests/server.test.js`, `.github/workflows/ci.yml` |
| **Commerce admin** | Create and edit products, upload optimized product images, manage visibility/SKU/inventory, process orders, cancel and restore stock, reset personal demo | `public/admin.js`, `commerce.js`, `server.js`, `tests/commerce.test.js` |

![Storefront](screenshots/store-desktop.png)

## Technologies demonstrated

**HTML5:** semantic landmarks, accessible form labels, native inputs, disclosure components.

**CSS3:** CSS Grid, Flexbox, variables, transitions, responsive media queries, reduced-motion support, custom control styling.

**JavaScript ES6+:** modern DOM APIs, arrow functions, template literals, async/await, Fetch, localStorage, debounced UI, error handling.

**jQuery:** real `$.ajax` calls to a Node API, event namespace management, and a reusable `$.fn.characterBudget` plugin.

**React:** actual stateful React component that computes totals using React state, isolated from jQuery-owned DOM.

**Bootstrap 5:** a real utility-based responsive grid in the Interaction Lab.

**Browser debugging:** real HTTP status codes (200, 422, 503), Chrome DevTools-compatible network paths, a user-triggered smoke test runner.

**Version control / automation:** repository-ready source layout, `.gitignore`, and a GitHub Actions workflow running syntax and API tests.

**eCommerce interface:** connected product CRUD, browser-side image optimization, inventory reservations, fulfillment-state validation, product status and sample order history, with no real-payment integration.

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
              +-- POST /api/admin/reset                [restore personal workspace]
              +-- Isolated JSON workspace per browser (server-side)
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

There is no `npm install` step and no API keys. Local data is sample-only. Each browser receives a random, HttpOnly cookie identifying an **isolated demo workspace**, which is saved under `.local-data/` (excluded from Git). You can override its directory with `PIXELPROOF_DATA_DIR`. The `PORT` environment variable is respected for deployment. **On Render Free, filesystem storage is ephemeral and may reset after restart/redeploy**; permanent production storage requires a durable database or persistent disk.

## Deploy on Render

1. Use the public GitHub repository `sachintechpro/PixelProof`, and upload the **contents of this updated folder** to its root, replacing matching existing files. Make sure `server.js`, `commerce.js`, `package.json`, `public/`, `.github/`, and `render.yaml` are at the root.
2. In Render, select **New → Web Service**, and connect your new GitHub repository.
3. Configure **Runtime: Node**, **Build Command: `echo "no build required"`**, **Start Command: `node server.js`**, **Health Check Path: `/api/health`**, and the **Free** plan if available. Leave the root directory at repository root. Render sets `PORT` automatically.
4. Deploy. Once healthy, paste the Render URL into the **Live URL** field above and your GitHub repository description.

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

- Sample products and checkout are **demonstrations**. The server validates orders and prices, records a **sample order** in a per-browser JSON workspace, and reserves/restores inventory as needed. It does **not** charge cards, collect payment information, email customers, or create real orders. Sample customer emails are validated but intentionally **not retained**.
- The admin console is **not a production-secured admin system**. This public review lab intentionally gives each visitor a separate sandbox workspace, with no access to other visitors’ data. For real commerce, add authentication, authorization, a durable database, audit logs, and payment integrations.
- **Render Free storage is ephemeral.** The per-browser JSON records survive normal page reloads and local process restarts but cannot be promised across free-service redeploys or instance replacement.
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
