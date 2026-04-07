import { auth } from "@/app/(auth)/auth";
import { IrisError } from "@/lib/errors";
import {
  getAllProviders,
  getProvider,
  registerProvider,
  removeProvider,
  updateGovernanceStatus,
} from "@/lib/federation/registry";
import { providerRegistrationSchema } from "@/lib/federation/types";

/**
 * POST /api/federation/register
 *
 * Register an external AI provider with Iris.  The provider must accept the
 * governance protocol (UK Certification Mark UK00004343685) as a condition
 * of registration.
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

  const parsed = providerRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        code: "bad_request:federation",
        message: "Invalid registration payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const provider = registerProvider({
    name: parsed.data.name,
    endpointUrl: parsed.data.endpointUrl,
    capabilities: parsed.data.capabilities,
  });

  return Response.json(provider, { status: 201 });
}

/**
 * GET /api/federation/register
 *
 * List all registered providers, or fetch one by ?id=<providerId>.
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
    return Response.json(provider);
  }

  return Response.json(getAllProviders());
}

/**
 * DELETE /api/federation/register?id=<providerId>
 *
 * Remove a registered provider.
 */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new IrisError("unauthorized:federation").toResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new IrisError("bad_request:federation").toResponse();
  }

  const removed = removeProvider(id);
  if (!removed) {
    return new IrisError("not_found:federation").toResponse();
  }

  return Response.json({ success: true });
}

/**
 * PATCH /api/federation/register
 *
 * Update a provider's governance status (promote to SOVEREIGN or demote to NULL).
 * This is the "human judicial mind" action that marks a provider as reviewed.
 */
export async function PATCH(request: Request) {
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

  const { id, governanceStatus } = body as {
    id?: string;
    governanceStatus?: string;
  };

  if (
    !id ||
    (governanceStatus !== "SOVEREIGN" && governanceStatus !== "NULL")
  ) {
    return Response.json(
      {
        code: "bad_request:federation",
        message:
          'Invalid payload. Provide "id" and "governanceStatus" ("SOVEREIGN" or "NULL").',
      },
      { status: 400 }
    );
  }

  const updated = updateGovernanceStatus(id, governanceStatus);
  if (!updated) {
    return new IrisError("not_found:federation").toResponse();
  }

  return Response.json(updated);
}
