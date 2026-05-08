# Deploy Iris in 30 seconds

You don't need a terminal, an API key, or Postgres on your laptop.

## ☁️  One-click cloud (Vercel)

1. Click the button:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fljbudgie%2FIris&project-name=iris&repository-name=iris&env=AUTH_SECRET&envDescription=Click%20%22Generate%22%20to%20create%20a%20random%20auth%20secret&envLink=https%3A%2F%2Fgenerate-secret.vercel.app%2F32&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

2. Sign in with GitHub. Vercel will:
   - Fork the repo to your account.
   - Provision Neon Postgres, Upstash KV (Redis) and Vercel Blob automatically.
   - Auto-provision the AI Gateway via OIDC — **you do not need an API key**.
3. Click **Generate** next to `AUTH_SECRET` so you don't have to make one.
4. Click **Deploy**. Wait ~60 seconds. You'll land on your own running Iris.

That's it. No code, no terminal, no secrets to manage.

## 💻  One-command local

If you'd rather run Iris on your own machine:

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

## 📱  Add to home screen

On mobile, the first time Iris is useful to you it will offer a one-tap
"Add Iris to home screen" sheet. Tap it and Iris becomes a real app icon
on your phone — no app store, no tracking.
