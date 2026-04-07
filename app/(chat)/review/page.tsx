"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { HumanReviewRequest } from "@/lib/db/schema";

type ReviewStatus = "pending" | "approved" | "rejected";

export default function ReviewQueuePage() {
  const [reviews, setReviews] = useState<HumanReviewRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/review`
      );
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const data = await res.json();
      setReviews(data);
    } catch {
      toast.error("Failed to load review queue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleResolve = async (
    reviewId: string,
    status: "approved" | "rejected"
  ) => {
    const res = fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, status }),
    });

    toast.promise(res, {
      loading: `${status === "approved" ? "Approving" : "Rejecting"}...`,
      success: () => {
        fetchReviews();
        return `Review ${status}!`;
      },
      error: `Failed to ${status === "approved" ? "approve" : "reject"} review.`,
    });
  };

  const filteredReviews =
    filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Human Review Queue</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {pendingCount} pending review{pendingCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5">
          {(["all", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              key={s}
              onClick={() => setFilter(s)}
              type="button"
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Loading reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {filter === "all"
              ? "No review requests yet."
              : `No ${filter} reviews.`}
          </p>
          <p className="text-muted-foreground/60 text-xs">
            Use the &quot;Request Human Review&quot; button on any AI response
            to add items here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              onResolve={handleResolve}
              review={review}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  onResolve,
}: {
  review: HumanReviewRequest;
  onResolve: (id: string, status: "approved" | "rejected") => void;
}) {
  const statusColors: Record<ReviewStatus, string> = {
    pending:
      "border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400",
    approved:
      "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400",
    rejected: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400",
  };

  const status = review.status as ReviewStatus;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}
            >
              {status}
            </span>
            <span className="text-muted-foreground text-xs">
              {new Date(review.createdAt).toLocaleString()}
            </span>
          </div>
          {review.reason && <p className="mt-1 text-sm">{review.reason}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <span>Chat: {review.chatId.slice(0, 8)}…</span>
        <span>·</span>
        <span>Message: {review.messageId.slice(0, 8)}…</span>
      </div>

      {review.reviewComment && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium text-muted-foreground text-xs">
            Review comment:
          </span>{" "}
          {review.reviewComment}
        </div>
      )}

      {status === "pending" && (
        <div className="flex items-center justify-end gap-2 border-t pt-3">
          <button
            className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => onResolve(review.id, "rejected")}
            type="button"
          >
            Reject
          </button>
          <button
            className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
            onClick={() => onResolve(review.id, "approved")}
            type="button"
          >
            Approve
          </button>
        </div>
      )}

      {review.resolvedAt && (
        <div className="text-muted-foreground text-xs">
          Resolved: {new Date(review.resolvedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
