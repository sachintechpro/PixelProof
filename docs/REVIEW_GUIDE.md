# PixelProof: five-minute technical review

This is the recommended employer review sequence. Every action can be verified in the UI and in source code.

## Minute 1: Inspect page quality

Open Overview on desktop and on a 390 px browser viewport. The layout is built with semantic HTML, Flexbox, Grid, and media queries. Use browser DevTools to inspect computed styles and responsive breakpoints. Inspect `public/styles.css` and `public/app.js`.

## Minute 2: Create a connected product and complete a storefront journey

Open Commerce admin → Products & inventory → Add product. Enter a unique SKU, price, stock, and description, then save it. Click Visit storefront to find your product.

### Complete a sample checkout

In Storefront, search for `lamp`, filter by Audio, sort by price, open a product, add products to the bag, change quantities, then complete the **simulated** checkout with a test email. Refresh the page and confirm the bag persists between visits. No payment or email is actually sent; the order is saved only in this browser's isolated demonstration workspace. Return to Commerce admin → Order processing, locate the new order, and mark it Processing → Shipped → Delivered. You can instead cancel a Pending or Processing order to restore its reserved inventory. The API is in `server.js`, demo state management is in `commerce.js`, and seeded catalog data is in `data.js`.

## Minute 3: Test design handoff

In Design studio, download the source SVG design brief, adjust accent color, radius, spacing, toggle the grid, preview mobile/tablet/desktop, and copy the generated CSS. Inspect `public/assets/design-brief.svg` and `public/styles.css`.

## Minute 4: Verify React and jQuery

In Interaction lab, toggle React price options and check that totals update without manual DOM manipulation. Search `lamp` via jQuery AJAX. Simulate a 503 error, observe graceful feedback, and retry. Type in the character-budget plugin and use the form validator. Open `public/react-lab.js` and `public/jquery.characterBudget.js`.

## Minute 5: Run the quality checks

In Quality bench, run six live browser checks. The console-like pane shows each result; no results are pre-populated. Run the Node API tests via `npm test`. Inspect `.github/workflows/ci.yml` for CI automation.

## Implementation integrity

- The React component is real but intentionally self-contained and locally bundled, so deployment needs no Node package installation. This is not being presented as a modern React/Vite production architecture.
- The eCommerce catalog and checkout are simulations; server validates inputs and derives trusted prices, saves sample orders in session-isolated JSON files, and tracks inventory changes. No payment or real order is created. Render Free storage is ephemeral. This is not a production-secured admin app.
- The image assets are original SVG illustrations for this project. The design reference is an SVG, **not a PSD**; no Photoshop or Illustrator authoring is claimed.
- Browser-side smoke checks verify behavior in the visitor's current browser. They are **not** proof of passing a cross-browser matrix. Use Chrome, Safari, Firefox, and Edge for manual compatibility testing before claiming it.
- No actual WordPress, Magento, BigCommerce, Shopify, PHP, or MySQL integration is included. Those were preferred rather than required in the referenced job description.
