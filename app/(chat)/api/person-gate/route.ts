import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { IrisError } from "@/lib/errors";
import { assessPersonGateContext } from "@/lib/person-gate";

/**
 * Lightweight "is this turn sensitive?" probe — used by the chat UI
 * to render a "PersonGate active" chip *before* the message is sent,
 * so the user can see the guardrail engage in real time.
 *
 * No commitment is created here (the chat route does that). This
 * endpoint runs the cheap pattern-match assessment only.
 */
const probeSchema = z.object({
  text: z.string().min(1).max(8000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError("bad_request:api").toResponse();
  }

  const parsed = probeSchema.safeParse(body);
  if (!parsed.success) {
    return new IrisError("bad_request:api").toResponse();
  }

  const assessment = assessPersonGateContext(parsed.data.text);
  return Response.json({
    sensitivity: assessment.sensitivity,
    requiresSovereignHandling: assessment.requiresSovereignHandling,
    tags: assessment.tags,
  });
}
