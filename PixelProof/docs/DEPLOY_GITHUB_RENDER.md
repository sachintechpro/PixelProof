# Publish PixelProof on GitHub + Render

## 1. Create the public GitHub repository

Open https://github.com/new and enter:

- Repository name: `PixelProof`
- Visibility: **Public**
- **Do not** select Initialize with README, .gitignore or license (they are already in this ZIP).

## 2. Upload the project to GitHub

Extract `PixelProof-github-render.zip`. Open a terminal inside the extracted **PixelProof** project folder (the directory containing `server.js` and `package.json`), then run:

```bash
git init
git add .
git commit -m "Launch PixelProof interactive frontend showcase"
git branch -M main
git remote add origin https://github.com/sachintechpro/PixelProof.git
git push -u origin main
```

You can alternatively use GitHub **Add file > Upload files** and upload all project root files/folders; be sure to include hidden `.github` and `.gitignore` files.

## 3. Deploy on Render

- Render > **New > Web Service** > connect `sachintechpro/PixelProof`
- Service name: `pixelproof`
- Runtime: `Node`
- Plan: `Free` (if available)
- Branch: `main`
- Build command: `echo "No build step required"`
- Start command: `node server.js`
- Health check path: `/api/health`
- Root directory: leave blank

Save/deploy. The app responds to the `PORT` variable Render supplies. You can also use the included `render.yaml` Blueprint.

## 4. Add live link and pin the project

- Edit the GitHub repository About section and add the real `https://pixelproof.onrender.com` URL **only once Render confirms it exists and loads** (the eventual URL may differ).
- Edit the README `Live URL` placeholder with the confirmed URL.
- Open your GitHub profile `https://github.com/sachintechpro` > **Customize your pins** > select **PixelProof**.
- If you have a profile README, see `docs/GITHUB_PROFILE.md` for a ready-to-paste section.

## 5. Verify

```bash
node server.js
npm test
npm run check
```

Browser demo paths: `/#/home`, `/#/store`, `/#/studio`, `/#/lab`, `/#/quality`.

Visit `/api/health` on Render to verify backend operation. Run the browser quality bench after deployment.
