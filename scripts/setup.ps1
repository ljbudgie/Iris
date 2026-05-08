# Iris one-command local setup (Windows / PowerShell).
#
# Usage:  pnpm setup    (or)    powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
#
# Mirrors scripts/setup.sh.

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

function Write-Cyan ($msg)  { Write-Host $msg -ForegroundColor Cyan }
function Write-Green ($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Red ($msg)   { Write-Host $msg -ForegroundColor Red }

Write-Cyan "🛡  Iris — sovereign local setup"
Write-Host ""

# 1. Node 20+
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Red "Node.js is required (20 or newer). Install from https://nodejs.org/"
  exit 1
}
$nodeMajor = [int](node -p 'process.versions.node.split(".")[0]')
if ($nodeMajor -lt 20) {
  Write-Red "Node.js 20+ required (found $(node -v))."
  exit 1
}
Write-Green "✓ Node $(node -v)"

# 2. pnpm via corepack
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Cyan "Installing pnpm via corepack…"
  corepack enable
  corepack prepare pnpm@10.32.1 --activate
}
Write-Green "✓ pnpm $(pnpm -v)"

# 3. Postgres via docker compose
$postgresUrl = "postgresql://iris:iris_local_dev@localhost:5432/iris_local"
if (Get-Command docker -ErrorAction SilentlyContinue) {
  Write-Cyan "Starting local Postgres via docker compose…"
  docker compose up -d postgres
  Write-Host "Waiting for Postgres" -NoNewline
  for ($i = 0; $i -lt 30; $i++) {
    docker compose exec -T postgres pg_isready -U iris -d iris_local *> $null
    if ($LASTEXITCODE -eq 0) { Write-Host " ready"; break }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
  }
  Write-Green "✓ Postgres running at $postgresUrl"
} else {
  Write-Red "Docker not found — using existing Postgres at `$POSTGRES_URL."
  Write-Red "Install Docker Desktop to get a one-command experience next time."
  if ($env:POSTGRES_URL) { $postgresUrl = $env:POSTGRES_URL }
}

# 4. .env.local
if (-not (Test-Path .env.local)) {
  Write-Cyan "Creating .env.local…"
  Copy-Item .env.example .env.local
  $authSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  $content = Get-Content .env.local -Raw
  $content = $content -replace "(?m)^AUTH_SECRET=.*",   "AUTH_SECRET=$authSecret"
  $content = $content -replace "(?m)^POSTGRES_URL=.*", "POSTGRES_URL=$postgresUrl"
  $content = $content -replace "(?m)^# *IRIS_LOCAL_ONLY=.*", "IRIS_LOCAL_ONLY=1"
  $content = $content -replace "(?m)^IRIS_LOCAL_ONLY=0", "IRIS_LOCAL_ONLY=1"
  Set-Content .env.local $content
  Write-Green "✓ .env.local written (AUTH_SECRET generated, IRIS_LOCAL_ONLY=1)"
} else {
  Write-Green "✓ .env.local already present — leaving untouched"
}

# 5. Install / migrate / dev
Write-Cyan "Installing dependencies…"
pnpm install
Write-Cyan "Running database migrations…"
pnpm db:migrate
Write-Green "✓ Setup complete."
Write-Host ""
Write-Cyan "Starting Iris at http://localhost:3000 …"
pnpm dev
