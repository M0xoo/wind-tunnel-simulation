# Wind Tunnel Simulation (React Three Fiber)

Interactive wind tunnel simulation built with React, Vite, and React Three Fiber.

## Run locally

```bash
npm install
npm run dev
```

## Prepare for GitHub

1. Create a new GitHub repository (for example: `wind-tunnel-simulation`).
2. Initialize git locally if needed and push:

```bash
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Publish to GitHub Pages

This project is configured to deploy with the `gh-pages` package.

1. Deploy:

```bash
npm run deploy
```

2. On GitHub, open **Settings > Pages** for your repository.
3. Set **Source** to **Deploy from a branch**.
4. Select branch **`gh-pages`** and folder **`/ (root)`**, then save.

Your site will be available at:

`https://<your-username>.github.io/<your-repo>/`

## Notes

- The deploy build uses `vite build --base=./` so assets load correctly on GitHub Pages.
- Re-run `npm run deploy` any time you want to publish updates.
