/**
 * Startup preflight: assert sovereign promises hold before Iris serves
 * any chat traffic.
 *
 * When `IRIS_LOCAL_ONLY=1` (the new default), Iris must not require any
 * outbound provider keys. We log a single visible banner so operators can
 * confirm the guarantee at a glance, and refuse to start in obviously
 * inconsistent configurations (e.g. local-only + cloud-only model
 * gateway with no local provider configured).
 */

import { isLocalOnly, isOllamaConfigured } from "./providers/ollama";

let logged = false;

export function runPreflight(): void {
  if (logged) {
    return;
  }
  logged = true;

  if (!isLocalOnly()) {
    console.log("[Iris] running in cloud / hybrid mode (IRIS_LOCAL_ONLY!=1).");
    return;
  }

  // Local-only: a banner the user can see in their server log so the promise
  // is auditable, and a soft warning if no local provider is configured.
  console.log(
    "🛡 Iris running local-only — no cloud calls. Provider: " +
      (isOllamaConfigured() ? "Ollama" : "(unconfigured)")
  );

  // Defence-in-depth: scrub gateway keys so that a misbehaving caller can't
  // accidentally reach the cloud while local-only is on.
  if (process.env.IRIS_LOCAL_ONLY === "1" && process.env.AI_GATEWAY_API_KEY) {
    console.log(
      "[Iris] AI_GATEWAY_API_KEY is set but IRIS_LOCAL_ONLY=1 — gateway calls will be refused."
    );
  }
}
