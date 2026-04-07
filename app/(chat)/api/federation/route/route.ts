import { auth } from "@/app/(auth)/auth";
import { IrisError } from "@/lib/errors";
import { evaluateResponses } from "@/lib/federation/governance";
import {
  getAllProviders,
  getProvider,
  getProvidersByCapability,
} from "@/lib/federation/registry";
import type {
  FederatedRouteResponse,
  FederationProvider,
  ProviderResponse,
} from "@/lib/federation/types";
import { federatedMessageSchema } from "@/lib/federation/types";

async function queryProvider(
  provider: FederationProvider,
  content: string
): Promise<ProviderResponse> {
  try {
    const res = await fetch(provider.endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return {
        providerId: provider.id,
        providerName: provider.name,
        content: `[Provider error: HTTP ${res.status}]`,
        governanceStatus: "NULL",
        respondedAt: new Date().toISOString(),
      };
    }

    const json = await res.json();
    return {
      providerId: provider.id,
      providerName: provider.name,
      content:
        typeof json.content === "string" ? json.content : JSON.stringify(json),
      governanceStatus: provider.governanceStatus,
      respondedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      providerId: provider.id,
      providerName: provider.name,
      content: `[Provider unreachable: ${err instanceof Error ? err.message : "Unknown error"}]`,
      governanceStatus: "NULL",
      respondedAt: new Date().toISOString(),
    };
  }
}

/**
 * POST /api/federation/route
 *
 * Route a user message to one or more registered providers, apply the
 * SOVEREIGN/NULL governance gate, and return responses with transparent
 * attribution.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new IrisError("unauthorized:federation").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError("bad_request:federation").toResponse();
  }

  const parsed = federatedMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        code: "bad_request:federation",
        message: "Invalid message payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { content, providerIds, capability } = parsed.data;

  // Resolve target providers
  let targets: FederationProvider[];

  if (providerIds && providerIds.length > 0) {
    targets = providerIds
      .map((pid) => getProvider(pid))
      .filter((p): p is FederationProvider => p !== undefined);

    if (targets.length === 0) {
      return new IrisError("not_found:federation").toResponse();
    }
  } else if (capability) {
    targets = getProvidersByCapability(capability);
    if (targets.length === 0) {
      return Response.json(
        {
          code: "not_found:federation",
          message: `No providers registered with capability "${capability}".`,
        },
        { status: 404 }
      );
    }
  } else {
    targets = getAllProviders();
    if (targets.length === 0) {
      return Response.json(
        {
          code: "not_found:federation",
          message: "No providers registered.",
        },
        { status: 404 }
      );
    }
  }

  // Fan-out to all target providers concurrently
  const rawResponses = await Promise.all(
    targets.map((provider) => queryProvider(provider, content))
  );

  // Apply SOVEREIGN/NULL governance gate
  const { approved, pendingReview } = evaluateResponses(rawResponses);

  const response: FederatedRouteResponse = {
    responses: [...approved, ...pendingReview],
    attribution: rawResponses.map((r) => ({
      providerId: r.providerId,
      providerName: r.providerName,
      governanceStatus: r.governanceStatus,
    })),
  };

  return Response.json(response);
}
