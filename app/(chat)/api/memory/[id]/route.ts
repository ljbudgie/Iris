import { auth } from "@/app/(auth)/auth";
import { IrisError } from "@/lib/errors";
import { getMemPalaceClient } from "@/lib/mempalace/client";

/**
 * "Forget this" endpoint — DELETE /api/memory/:id
 *
 * MemPalace is append-only by design (every drawer is content-addressed
 * and immutable for audit purposes). To honour the user's right to
 * "forget", Iris files a tombstone drawer in the same wing — a record
 * that the original drawer should be excluded from future searches and
 * model context.
 *
 * The MemPalace search/query layer is responsible for honouring these
 * tombstones at read time. This route is the user-facing entry point
 * required by the master vision's "Respect 'forget' and 'never remember'
 * requests immediately." promise.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  const { id } = await context.params;
  if (!id) {
    return new IrisError("bad_request:api", "Missing memory id.").toResponse();
  }

  const client = getMemPalaceClient();
  if (!client) {
    return new IrisError(
      "bad_request:api",
      "MemPalace is not configured."
    ).toResponse();
  }

  if (!client.isConnected()) {
    await client.connect();
  }

  await client.addDrawer({
    wing: "wing_user",
    room: "tombstones",
    content: JSON.stringify({
      forgets: id,
      requestedAt: new Date().toISOString(),
      requestedBy: session.user.id,
      reason: "user_forget_request",
    }),
    added_by: "iris",
  });

  return Response.json({ forgotten: id });
}
