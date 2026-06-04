"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import { MessageSquare, Calendar, CheckCircle2, Circle, Star } from "lucide-react";

type ReviewerType = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  reputation: number;
};

type ReviewType = {
  id: string;
  content: string;
  lineReference: number | null;
  rating: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer: ReviewerType;
};

type ReviewListProps = {
  submissionId: string;
  initialReviews: ReviewType[];
  isAuthor: boolean;
};

export default function ReviewList({ submissionId, initialReviews, isAuthor }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewType[]>(initialReviews);

  // 1. Listen for real-time reviews via Pusher
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "mock-key", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
    });

    const channelName = `submission-${submissionId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-review", (newReview: any) => {
      // Avoid duplicate keys if Pusher fires multiple times or we fetch it
      setReviews((prev) => {
        if (prev.some((r) => r.id === newReview.id)) return prev;
        return [newReview, ...prev];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [submissionId]);

  // 2. Optimistically resolve a review (only for authors)
  const handleResolveToggle = async (reviewId: string, currentStatus: boolean) => {
    const originalReviews = [...reviews];
    const newStatus = !currentStatus;

    // Optimistically update
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, isResolved: newStatus } : r))
    );

    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, isResolved: newStatus }),
      });

      if (!res.ok) {
        // Rollback
        setReviews(originalReviews);
      }
    } catch (err) {
      console.error("Failed to update resolution status:", err);
      setReviews(originalReviews);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-200/50 pb-3 dark:border-zinc-800/50 mb-6">
        <MessageSquare className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-lg">Reviews List ({reviews.length})</h3>
      </div>

      {reviews.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
          No reviews submitted yet. Be the first to submit a review!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-3xl border transition-all duration-300 ${
                rev.isResolved
                  ? "bg-zinc-50/50 border-zinc-200/40 opacity-75 dark:bg-zinc-900/10 dark:border-zinc-800/20"
                  : "glass-card border-white/10 shadow-md"
              }`}
            >
              {/* Review Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {rev.reviewer.avatarUrl ? (
                    <img
                      src={rev.reviewer.avatarUrl}
                      alt={rev.reviewer.displayName}
                      className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800"
                    />
                  ) : (
                    <div className="flex w-8 h-8 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">
                      {rev.reviewer.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                        {rev.reviewer.displayName}
                      </h4>
                      <span className="text-[10px] text-zinc-400">@{rev.reviewer.username}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Rating display */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{rev.rating}</span>
                  </div>

                  {/* Resolution Button (Authors only) or status badge (Regular users) */}
                  {isAuthor ? (
                    <button
                      onClick={() => handleResolveToggle(rev.id, rev.isResolved)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 ${
                        rev.isResolved
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50"
                      }`}
                    >
                      {rev.isResolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </>
                      )}
                    </button>
                  ) : (
                    rev.isResolved && (
                      <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Line Reference if provided */}
              {rev.lineReference !== null && (
                <div className="mt-3.5 inline-block text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 px-2.5 py-0.5 rounded-lg">
                  Ref Line: {rev.lineReference}
                </div>
              )}

              {/* Review Content */}
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {rev.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
