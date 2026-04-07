import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createHumanReviewRequest,
  getChatById,
  getHumanReviewRequestById,
  getHumanReviewRequestByMessageId,
  getHumanReviewRequestsByUserId,
  getMessageById,
  resolveHumanReviewRequest,
} from "@/lib/db/queries";
import { IrisError } from "@/lib/errors";

const createReviewSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  reason: z.string().max(1000).optional(),
});

const resolveReviewSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  reviewComment: z.string().max(2000).optional(),
});

/**
 * GET /api/review
 *
 * List all human review requests for the authenticated user.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new IrisError("unauthorized:review").toResponse();
  }

  const reviews = await getHumanReviewRequestsByUserId({
    userId: session.user.id,
  });

  return Response.json(reviews, { status: 200 });
}

/**
 * POST /api/review
 *
 * Create a new human review request for a NULL-flagged response.
 * The user must own the chat containing the message.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new IrisError("unauthorized:review").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError(
      "bad_request:review",
      "Invalid JSON body."
    ).toResponse();
  }

  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        code: "bad_request:review",
        message: "Invalid review request payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { chatId, messageId, reason } = parsed.data;

  // Verify chat ownership
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return new IrisError("not_found:review", "Chat not found.").toResponse();
  }

  if (chat.userId !== session.user.id) {
    return new IrisError("forbidden:review").toResponse();
  }

  // Verify message exists and belongs to this chat
  const messages = await getMessageById({ id: messageId });
  if (messages.length === 0) {
    return new IrisError("not_found:review", "Message not found.").toResponse();
  }

  const msg = messages[0];
  if (msg.chatId !== chatId) {
    return new IrisError(
      "bad_request:review",
      "Message does not belong to the specified chat."
    ).toResponse();
  }

  // Prevent duplicate pending review requests for the same message
  const existing = await getHumanReviewRequestByMessageId({ messageId });
  if (existing && existing.status === "pending") {
    return Response.json(existing, { status: 200 });
  }

  const review = await createHumanReviewRequest({
    chatId,
    messageId,
    userId: session.user.id,
    reason,
  });

  return Response.json(review, { status: 201 });
}

/**
 * PATCH /api/review
 *
 * Resolve an existing human review request (approve or reject).
 * Only the owning user can resolve their own review requests.
 */
export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new IrisError("unauthorized:review").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError(
      "bad_request:review",
      "Invalid JSON body."
    ).toResponse();
  }

  const parsed = resolveReviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        code: "bad_request:review",
        message: "Invalid resolve payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { reviewId, status, reviewComment } = parsed.data;

  const existing = await getHumanReviewRequestById({ id: reviewId });
  if (!existing) {
    return new IrisError("not_found:review").toResponse();
  }

  if (existing.userId !== session.user.id) {
    return new IrisError("forbidden:review").toResponse();
  }

  const updated = await resolveHumanReviewRequest({
    id: reviewId,
    status,
    reviewComment,
  });

  return Response.json(updated, { status: 200 });
}
