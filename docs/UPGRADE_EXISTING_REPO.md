# Upgrade existing PixelProof GitHub repo to Commerce Admin v2

The project repository already exists at https://github.com/sachintechpro/PixelProof . Do not create another repository.

## GitHub website upload (no Git command line)

1. Download and extract `PixelProof-v2-Commerce-Admin.zip`.
2. Open https://github.com/sachintechpro/PixelProof .
3. Select **Add file → Upload files** on the `main` branch.
4. Drag the *contents* of the extracted folder — `server.js`, `commerce.js`, `data.js`, `package.json`, `public`, `tests`, `docs`, `.github`, etc. — into the upload area. Preserve folder structure. Avoid putting the files inside a second `PixelProof` directory.
5. Commit changes to `main` using a message such as `Add connected commerce admin and order workflow`.

If GitHub's browser upload does not preserve folder structure, use Git (below) instead.

## Git method (best for existing repositories)

```bash
git clone https://github.com/sachintechpro/PixelProof.git
cd PixelProof
# Copy ALL extracted ZIP contents into this directory, replacing matching files.
git add -A
git commit -m "Add connected commerce admin and order workflow"
git push origin main
```

**Important:** Do not `git init` inside an existing clone or force-push. `.local-data/` is excluded from Git.

## Render

If Render is connected to `sachintechpro/PixelProof` with automatic deploys enabled, pushing `main` triggers deployment. Otherwise, open the Render service dashboard and deploy the latest `main` commit.

- Runtime: **Node**
- Repository root: `server.js`, `commerce.js`, `package.json` at top level (Root Directory blank)
- Build Command: `echo "no build required"`
- Start Command: `node server.js`
- Health Check: `/api/health`
- App admin route: `https://YOUR-RENDER-URL.onrender.com/#/admin`

The catalog and orders are sample-only and separated per visitor. **On a Free web service, uploaded demo data can reset after restart or deployment**, because Render Free uses ephemeral storage. For permanent data, configure a durable database and user authentication in a further iteration.

## Validation

`npm run check` (runs JavaScript syntax checks and 24 Node API/template tests).

After the new Render deploy, manually open the Storefront and Commerce admin pages on desktop and mobile to verify navigation, product creation, image upload, checkout and fulfillment.
