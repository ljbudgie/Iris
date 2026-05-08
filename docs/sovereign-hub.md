# Sovereign Hub Mode

> One machine in your home or advocacy office acts as the hub.
> Phones and tablets connect to it instead of the cloud.

Sovereign Hub Mode lets a household, support worker, or advocacy office run a
single trusted Iris instance and have other devices on the local network use
it as a memory and skill peer — no cloud round-trip, no third-party API keys,
no surveillance vector.

## Enabling

1. On the machine that should act as the hub, set:

   ```bash
   IRIS_HUB_MODE=1
   ```

   in `.env.local` and restart Iris. (`pnpm dev` or `pnpm start`.)

2. The endpoint `GET /api/hub` will start responding with a JSON document
   advertising the hub's protocol version, capabilities, and currently
   registered peers. When hub mode is off, the same endpoint returns 404.

3. On other devices, set the Iris environment variable
   `NEXT_PUBLIC_HUB_URL=https://your-hub.local` so the client knows where
   to register.

The `/hub` page in the UI will show "This Iris is acting as a Sovereign Hub
for N peers" with a status indicator.

## Operating model

- The hub is the **single source of truth** for any memory it stores. Peers
  read from it; they do not maintain their own copy. This matches the
  "Memory Palace as single source of truth" guarantee in the master vision.
- Federation registrations from peers go through the existing
  governance gate (`SOVEREIGN` / `NULL`) — see [`lib/federation/governance.ts`](../lib/federation/governance.ts).
- Sensitive tools (e.g. `generateBurgessLetter`) are **not** exposed to peers
  whose governance status is `NULL`.

## Threat model & current limitations

The initial scaffold (this PR) deliberately omits the peer authentication
handshake. Until it is added you should:

- Only run hub mode on a **trusted LAN** (your home network, a VPN, or a
  Tailscale tailnet).
- Not expose `/api/hub` to the public internet.

A `TODO(sovereign-hub)` marker in
[`app/(chat)/api/hub/route.ts`](../app/(chat)/api/hub/route.ts) tracks the
work needed to add either mTLS or pre-shared-key authentication for peers.
The contract that handshake must satisfy is described in
[`tests/unit/hub.test.ts`](../tests/unit/hub.test.ts).

## Why this exists

Many of the people Iris is built for share devices — a parent with a tablet,
a support worker with a laptop, a tribunal advocate with a desktop. Sovereign
Hub Mode means they can keep one shared, auditable Memory Palace without
any of those devices ever touching the cloud.
