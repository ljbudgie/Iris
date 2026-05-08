#!/usr/bin/env bash
# Iris one-command local setup.
#
# Usage:  pnpm setup        (or)  bash scripts/setup.sh
#
# Goal: a non-technical user runs one command and reaches the chat
# screen — no manual env editing, no manual Postgres install.

set -euo pipefail

cd "$(dirname "$0")/.."

cyan()  { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*" 1>&2; }

cyan "🛡  Iris — sovereign local setup"
echo

# ----------------------------------------------------------------------
# 1. Verify Node 20+
# ----------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  red "Node.js is required (20 or newer). Install from https://nodejs.org/"
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  red "Node.js 20+ required (found $(node -v))."
  exit 1
fi
green "✓ Node $(node -v)"

# ----------------------------------------------------------------------
# 2. Verify pnpm 10+ (install via corepack if missing)
# ----------------------------------------------------------------------
if ! command -v pnpm >/dev/null 2>&1; then
  cyan "Installing pnpm via corepack…"
  corepack enable
  corepack prepare pnpm@10.32.1 --activate
fi
green "✓ pnpm $(pnpm -v)"

# ----------------------------------------------------------------------
# 3. Spin up Postgres via docker compose
# ----------------------------------------------------------------------
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  cyan "Starting local Postgres via docker compose…"
  docker compose up -d postgres

  # Wait for Postgres to become healthy
  printf "Waiting for Postgres"
  for _ in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U iris -d iris_local >/dev/null 2>&1; then
      printf " ready\n"
      break
    fi
    printf "."
    sleep 1
  done
  POSTGRES_URL="postgresql://iris:iris_local_dev@localhost:5432/iris_local"
  green "✓ Postgres running at $POSTGRES_URL"
else
  red "Docker not found — using existing Postgres at \$POSTGRES_URL."
  red "Install Docker Desktop to get a one-command experience next time."
  POSTGRES_URL="${POSTGRES_URL:-postgresql://localhost:5432/iris_local}"
fi

# ----------------------------------------------------------------------
# 4. Write .env.local (preserve existing)
# ----------------------------------------------------------------------
if [ ! -f .env.local ]; then
  cyan "Creating .env.local…"
  cp .env.example .env.local

  # Generate AUTH_SECRET
  if command -v openssl >/dev/null 2>&1; then
    AUTH_SECRET="$(openssl rand -base64 32)"
  else
    AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  fi

  # Cross-platform sed in-place
  sed_inplace() {
    if [ "$(uname)" = "Darwin" ]; then
      sed -i '' "$@"
    else
      sed -i "$@"
    fi
  }

  sed_inplace "s|^AUTH_SECRET=.*|AUTH_SECRET=$AUTH_SECRET|" .env.local
  sed_inplace "s|^POSTGRES_URL=.*|POSTGRES_URL=$POSTGRES_URL|" .env.local
  # Local-first by default — flips IRIS_LOCAL_ONLY to 1 if commented or 0.
  sed_inplace "s|^# *IRIS_LOCAL_ONLY=.*|IRIS_LOCAL_ONLY=1|" .env.local
  sed_inplace "s|^IRIS_LOCAL_ONLY=0|IRIS_LOCAL_ONLY=1|" .env.local

  green "✓ .env.local written (AUTH_SECRET generated, IRIS_LOCAL_ONLY=1)"
else
  green "✓ .env.local already present — leaving untouched"
fi

# ----------------------------------------------------------------------
# 5. Install deps, migrate, dev
# ----------------------------------------------------------------------
cyan "Installing dependencies…"
pnpm install

cyan "Running database migrations…"
pnpm db:migrate || red "Migrations failed — check POSTGRES_URL in .env.local."

green "✓ Setup complete."
echo
cyan "Starting Iris at http://localhost:3000 …"
exec pnpm dev
