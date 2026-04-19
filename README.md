# Stoja Website

Static marketing site scaffold for **Stoja**, optimized for GitHub Pages deployment.

## Included pages

- `index.html` (download-focused landing page + modal)
- `pages/how-it-works.html`
- `pages/support.html`
- `pages/legal.html`
- `pages/terms.html`
- `pages/privacy.html`

## Local preview

Run from project root:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub: **Settings → Pages**.
3. Under "Build and deployment", choose:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (or your default branch), folder `/ (root)`
4. Save and wait for the site to publish.

For a custom domain later, add a `CNAME` file with your domain name.
