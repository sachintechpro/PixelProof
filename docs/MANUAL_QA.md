# Manual QA checklist

## Navigation and responsiveness
- [ ] All six main navigation destinations load from the top navigation.
- [ ] Mobile menu opens and closes; buttons remain keyboard accessible.
- [ ] No horizontal scrollbar at widths 320, 375, 390, 768, 1024, 1440.
- [ ] Browser back/forward navigates between hash routes.
- [ ] Reduced motion preference disables unnecessary animation.

## Storefront
- [ ] Six products load from `/api/products`.
- [ ] Category filtering, sorting, and search all work in combination.
- [ ] No-results and request-error states show useful messages.
- [ ] Quick view opens and closes by close button, backdrop, and Escape.
- [ ] Cart quantity reflects additions and persists after refresh.
- [ ] Invalid email returns an error; valid email completes a simulated order.
- [ ] Checkout total is calculated by server, not accepted from client payload.

## Commerce admin
- [ ] On initial load, three sample orders and six seeded products are visible.
- [ ] Create a product with SKU, price, inventory, description and image; confirm the item appears in the storefront.
- [ ] Upload a PNG/JPEG/WebP and confirm it is optimized and previewed.
- [ ] Editing price or stock updates the storefront; hiding a product removes it from the customer catalog.
- [ ] Duplicate SKUs, negative stock, malformed prices and unsupported image formats are rejected.
- [ ] A sample order immediately appears in Order processing and decrements inventory.
- [ ] Invalid fulfillment jumps are rejected; processing → shipped → delivered works.
- [ ] Cancelling a Pending or Processing order restores inventory.
- [ ] Reset restores seeded items and sample orders for this browser only.
- [ ] Two fresh browsers have separate demo workspaces.
- [ ] Manual refresh retains workspace changes unless ephemeral hosting recreated the server instance.
- [ ] Navigation, tables, and product editor remain usable at mobile widths.

## Design studio
- [ ] Five accent swatches update the rendered CTA and code output.
- [ ] Radius and spacing sliders update CSS custom properties.
- [ ] Desktop/tablet/mobile modes change simulated viewport width.
- [ ] Grid overlay shows and hides.
- [ ] Reset and Copy CSS function.
- [ ] SVG reference is available to download.

## Interaction lab
- [ ] React configurator updates estimated total and can reset.
- [ ] jQuery search throttles calls and displays results.
- [ ] Simulated 503 shows error rather than uncaught exception.
- [ ] Custom jQuery plugin updates character count and warning state.
- [ ] Form validator explains missing/invalid fields.
- [ ] Accordion buttons update aria-expanded and content visibility.
- [ ] Bootstrap columns stack at mobile widths.

## Quality bench
- [ ] Six checks run on demand and report actual outcomes.
- [ ] API health, filtering, validation, asset HEAD request pass.
- [ ] Responsive CSS and current-viewport overflow checks pass.
- [ ] Landmarks and image alt attributes exist.

## Review environments
- Chromium latest (desktop and mobile) — test.
- Firefox desktop — test.
- WebKit/Safari desktop and iPhone — test.
- Edge desktop — test.

Only check a browser off once actually run; this checklist does not claim cross-browser pass status.
