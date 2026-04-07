import { auth } from "@/app/(auth)/auth";
import { IrisError } from "@/lib/errors";
import { getAllProviders, getProvider } from "@/lib/federation/registry";
import type { ProviderId } from "@/lib/federation/types";

type HealthResult = {
  providerId: ProviderId;
  providerName: string;
  endpointUrl: string;
  healthy: boolean;
  latencyMs: number | null;
  error?: string;
};

async function checkProviderHealth(provider: {
  id: ProviderId;
  name: string;
  endpointUrl: string;
}): Promise<HealthResult> {
  const start = Date.now();
  try {
    const res = await fetch(provider.endpointUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return {
      providerId: provider.id,
      providerName: provider.name,
      endpointUrl: provider.endpointUrl,
      healthy: res.ok,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      providerId: provider.id,
      providerName: provider.name,
      endpointUrl: provider.endpointUrl,
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * GET /api/federation/health
 *
 * Check health of all registered providers, or a single one via ?id=<providerId>.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new IrisError("unauthorized:federation").toResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const provider = getProvider(id);
    if (!provider) {
      return new IrisError("not_found:federation").toResponse();
    }
    const result = await checkProviderHealth(provider);
    return Response.json(result);
  }

  const providers = getAllProviders();
  const results = await Promise.all(providers.map(checkProviderHealth));
  return Response.json(results);
}
