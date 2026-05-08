/**
 * Sovereign Hub Mode endpoint.
 *
 * When `IRIS_HUB_MODE=1`, this endpoint advertises this Iris instance
 * as a discoverable peer for other Iris instances on the same network.
 *
 * GET  /api/hub  → { hub: true, capabilities, peers }   (when enabled)
 *                → 404                                  (when disabled)
 *
 * The handshake is intentionally minimal — peer auth is out of scope
 * for the initial scaffold (see docs/sovereign-hub.md). Federation
 * registration uses the existing `lib/federation/registry.ts` so the
 * Burgess governance status applies the moment a peer registers.
 */

import { getAllProviders } from "@/lib/federation";

export function GET() {
  if (process.env.IRIS_HUB_MODE !== "1") {
    return new Response("Sovereign Hub Mode is disabled.", { status: 404 });
  }

  const peers = getAllProviders().map((p) => ({
    id: p.id,
    name: p.name,
    governanceStatus: p.governanceStatus,
    registeredAt: p.registeredAt,
  }));

  return Response.json({
    hub: true,
    protocol: "iris-hub/0.1",
    capabilities: ["memory.search", "memory.read"],
    peers,
    // TODO(sovereign-hub): add peer auth handshake (mTLS or shared
    // pre-shared keys). Until then, only run hub mode on a trusted LAN.
  });
}
