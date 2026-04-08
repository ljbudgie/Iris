import { auth } from "@/app/(auth)/auth";
import { exportUserData } from "@/lib/db/queries";
import { IrisError } from "@/lib/errors";

/**
 * GET /api/export
 *
 * Exports all data owned by the authenticated user as a JSON download.
 *
 * This endpoint exists because the Burgess Principle guarantees that all
 * user data belongs completely to the user.  They have the right to carry
 * it out at any time — no questions asked.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  try {
    const data = await exportUserData({ userId: session.user.id });

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="iris-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Failed to export user data:", error);
    return new IrisError("bad_request:database").toResponse();
  }
}
