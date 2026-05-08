/**
 * Server-side probe for a local Ollama instance.
 *
 * The onboarding wizard uses this to decide whether to preselect the
 * Ollama provider. We probe from the server so we don't rely on the
 * browser being able to make a CORS-allowed request to Ollama's HTTP
 * surface (it isn't, by default).
 */

import { getOllamaBaseUrl } from "@/lib/ai/providers/ollama";

export async function GET() {
  const baseUrl = getOllamaBaseUrl().replace(/\/v1\/?$/, "");
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      // Short timeout — we don't want to block onboarding on a hung host.
      signal: AbortSignal.timeout(1500),
    });
    return Response.json({ reachable: res.ok });
  } catch {
    return Response.json({ reachable: false });
  }
}
