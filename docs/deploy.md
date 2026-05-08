# Run Iris offline in 30 seconds

You don't need cloud hosting, API keys, or Vercel. This path takes you to Iris running locally on your own machine.

## 💻  One-command local

The fastest offline path is one command from a fresh clone:

```bash
git clone https://github.com/ljbudgie/Iris.git
cd Iris
pnpm setup
```

`pnpm setup` will:

1. Verify Node 20+ and install pnpm via corepack if needed.
2. Spin up Postgres in Docker (`docker compose up -d`).
3. Write `.env.local` for you with a freshly generated `AUTH_SECRET` and `IRIS_LOCAL_ONLY=1`.
4. Install dependencies, run migrations, and start the dev server at <http://localhost:3000>.

When you visit Iris for the first time you'll see a 3-step onboarding wizard
that asks how you want to run — **Local**, **Cloud**, or **Hybrid** — and ends
with a 15-second Burgess Principle overlay so you know what you've installed.

For the full manual offline walkthrough, see [`self-hosting.md`](./self-hosting.md).

## 📱  Add to home screen

On mobile, the first time Iris is useful to you it will offer a one-tap
"Add Iris to home screen" sheet. Tap it and Iris becomes a real app icon
on your phone — no app store, no tracking.
