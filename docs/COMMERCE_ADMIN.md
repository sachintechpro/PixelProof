# PixelProof Commerce Admin (v3)

Open `/#/admin` from the top navigation. Public demo username: `demo.admin`; password: `PixelProof@2026`.

This is the business-owner counterpart to the fictional storefront. Unlike the earlier isolated prototype, the server now maintains a **shared fictional catalog and order queue** across browsers. Products and inventory updates become visible to all storefront visitors; a checkout order appears in admin without needing to share a browser session. Do not enter real customer details.

## Admin workflows

- Create and edit products, categories, prices, inventory, visibility and optimized images. Product updates are immediately visible to public storefront requests.
- Browse and expand individual orders to see line items, totals, simulated payment status, demo customer and fictional delivery address.
- New successful demo checkouts become **Ready** with inventory reserved. Generate a shipping label only for a Ready order. The printable HTML label prominently states **DEMONSTRATION ONLY — NOT VALID FOR SHIPMENT**.
- Enter the exact `DEMO-LBL-...` label reference before **Mark dispatched**. Wrong refs return HTTP 422; out-of-order transitions return HTTP 409.
- Mark the simulated dispatched order **Delivered**. Cancellation is available only before dispatch and returns reserved inventory.
- Seeded **On Hold** order requires a stock increase and a **Recheck inventory** action before a label is allowed.
- **Reset** restores shared fictional data and affects all visitors. The stored JSON file is ephemeral on Render Free and may reset on redeploy.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/orders` | Demo checkout and trusted order pricing, fictional payment token and stock reservation |
| GET | `/api/admin/overview` | Summary metrics |
| GET/POST | `/api/admin/products` | Product listing and creation |
| PATCH/DELETE | `/api/admin/products/:id` | Product updates/deletion |
| GET | `/api/admin/orders` | Shared fictional order queue |
| PATCH | `/api/admin/orders/:id` | Controlled status transitions/cancel and stock return |
| POST | `/api/admin/orders/:id/label` | Generate fictitious shipping label reference |
| GET | `/api/admin/orders/:id/label` | Printable invalid label HTML, admin session required |
| POST | `/api/admin/orders/:id/dispatch` | Verify matching label and mark dispatched |
| POST | `/api/admin/orders/:id/recheck` | Recheck held order after stock replenishment |
| GET | `/api/admin/activity` | Server-side demo activity log |
| POST | `/api/admin/reset` | Reset shared demo data |

No actual gateway transaction, postage charge, carrier handoff, supplier purchase, tax rate, or tracking API is connected. This is not production-ready checkout, payment, security, or storage.
