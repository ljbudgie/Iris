/**
 * POST /api/loop/classify
 *
 * Integration Contract v2.0 local endpoint. Advisory only.
 * A named human must confirm any finding before publication.
 */
import { classifyThread, type LoopMessageInput } from "@/lib/loop";
import { IrisError } from "@/lib/errors";

type Body = {
  institution?: string | null;
  named_individual?: string | null;
  messages?: LoopMessageInput[];
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new IrisError("bad_request:loop").toResponse();
  }

  try {
    const finding = classifyThread({
      institution: body.institution,
      named_individual: body.named_individual,
      messages: body.messages ?? [],
    });
    return Response.json(finding);
  } catch (error) {
    const cause = error instanceof Error ? error.message : "Invalid loop payload.";
    return new IrisError("bad_request:loop", cause).toResponse();
  }
}
