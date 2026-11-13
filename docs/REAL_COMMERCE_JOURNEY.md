
# PixelProof v3 — Customer-to-dispatch simulation

Inspired by the working sequence in [CommerceDesk](https://github.com/sachintechpro/commercedesk), adapted into **the existing PixelProof repository**, not a separate app.

1. Open **Storefront**, select products, add to cart and adjust quantities.
2. Choose **Checkout**. Fill in fictional name, email and delivery address. A **Fill test checkout** button supplies safe fictional values.
3. Enter only a permitted **demonstration** payment card number. The approved test number is `4242 4242 4242 4242`; test expiry `12/30`, test CVC `123`. The declined test number is `4000 0000 0000 0002`.
4. Submit **Place demo order**. The browser only sends a symbolic test-payment token (`demo-visa-4242`), not the card number, CVC or expiry. The Node server recalculates prices and inventory, simulates payment authorization and records the order as **Ready**.
5. In a separate browser or tab, open **Admin login** with public demo account `demo.admin` / `PixelProof@2026`. Admin sees the **same shared fictional orders**.
6. In **Order processing**, open the new order, inspect items, buyer, payment reference and shipping address.
7. Click **Generate label**. Print the fictional label with a prominent **NOT VALID FOR SHIPMENT** warning.
8. Enter the exact generated label reference to **Mark dispatched**. A wrong reference must fail. Mark **Delivered** afterward.
9. Optional: cancel an order before dispatch to restore stock; test out-of-stock checkout and a declined payment attempt.

**Safety and limitations:** No live charges, real payment processor, real carrier/postage, or real shipping. Never enter real card numbers or personal details. The shared demo queue is publicly visible to anyone with the published admin credentials; records must remain fictional. JSON state lives in the Render service filesystem and may reset on redeploy. Production needs real PCI-compliant hosted payment fields, private authentication and authorization, durable storage, concurrency-safe inventory transactions, real carrier integration, audit retention, fraud controls, tax calculation, and privacy safeguards.

**Render configuration:** Set Root Directory to blank so Render runs the root-level `server.js`, not the older duplicate nested `PixelProof/` directory.
