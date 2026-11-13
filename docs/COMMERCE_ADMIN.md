# PixelProof Commerce Admin — Technical Walkthrough

A working, isolated demonstration of eCommerce back-office development. Visit **Commerce admin** in the top navigation or `/#/admin` directly.

## What reviewers can test

1. **Create product:** Set a unique SKU, name, category, price, stock, finish, description, visibility and image. Select a bundled SVG illustration or upload a PNG/JPEG/WebP (client-side canvas optimization to WebP, 512 px max). The server validates every field and caps payloads.
2. **See it in the storefront:** Visit `/#/store`. The storefront reads the same workspace's catalog via `/api/products`; edits, prices, visibility and remaining stock appear in the customer UI.
3. **Create a sample order:** Add a product to the cart and enter a test email at checkout. The **server** validates quantities and calculates trusted prices, applies shipping, creates a sample order record, and reserves inventory. No payment is collected, and the email is not saved in the order record.
4. **Process the order:** Visit Admin → Order processing. Expand the new order, then move Pending → Processing → Shipped → Delivered. Invalid transitions return HTTP 409. Pending/Processing orders can be cancelled and stock is restored.
5. **Explore errors:** Try duplicate SKUs (HTTP 409), invalid product inputs (HTTP 422), out-of-stock checkout (HTTP 422), and unknown API routes (HTTP 404). Server and UI display error messages.
6. **Reset:** A confirmation-backed reset restores starter products and sample orders **for your browser's workspace**, without changing other visitors' demo workspaces.

## API map

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/products` | Public active catalog, search, category, sorting |
| GET | `/api/suggest` | Live product suggestions |
| POST | `/api/orders` | Sample checkout, stock reservation, server-side totals |
| GET | `/api/admin/overview` | Order metrics and inventory summary |
| GET/POST | `/api/admin/products` | View all products or create new product |
| PATCH/DELETE | `/api/admin/products/:id` | Edit and delete product |
| GET | `/api/admin/orders` | Inspect order queue, saved line-item snapshots |
| PATCH | `/api/admin/orders/:id` | Transition fulfillment stage (and restock on cancellation) |
| POST | `/api/admin/reset` | Restore starter sandbox data |

## Storage and privacy constraints

- The server issues a random 48-character HttpOnly SameSite=Lax workspace cookie. Its value identifies a separate demo dataset for this browser. Mutating requests require JSON and check Origin when supplied.
- Workspace state is written atomically to `.local-data/<random-id>.json` (excluded from version control). `PIXELPROOF_DATA_DIR` can override the storage path. This survives process restarts when the filesystem remains intact.
- **Render Free filesystems are ephemeral:** demo workspaces may reset after service restart, deploy or instance replacement. A real system would use a durable database with backup, migrations, observability, access controls and audit history.
- **No real login or privileged user authentication is implemented.** This is intentional for a public, isolated portfolio lab, **not** a model for production admin security.
- Email is validated at sample checkout, but no customer email is stored in the order record. No payment data, real customers, card charging, shipping carrier, or external commerce platform is involved.
- Data has intentionally small limits (40 products per workspace, 100 recorded sample orders, 6 MB image input client-side and ~400 KB optimized output) to keep the public demo lightweight.

## Source code

- `public/admin.js` — admin console interactions, product editor, image conversion and order actions.
- `public/styles.css` — admin console responsive layout and styling.
- `commerce.js` — domain logic, validation, session isolation, seed catalog, inventory rules, JSON persistence.
- `server.js` — web server, API handlers, method checks, response codes.
- `tests/commerce.test.js` — end-to-end API-level tests for CRUD, duplicates, visibility, checkout, inventory, fulfillment and isolation.

**Design principle:** A hiring reviewer should be able to execute a concrete action and verify the corresponding state change, rather than relying on unsupported statements about skills.
