import { auth } from "@/app/(auth)/auth";
import { getAuditLogByUserId } from "@/lib/db/queries";
import { IrisError } from "@/lib/errors";

/**
 * GET /api/audit
 *
 * Returns the most recent 100 audit log entries for the current user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  try {
    const entries = await getAuditLogByUserId({ userId: session.user.id });
    return Response.json(entries);
  } catch (error) {
    console.error("Failed to fetch audit log:", error);
    return new IrisError("bad_request:database").toResponse();
  }
}
