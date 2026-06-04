"use client";

import { useState } from "react";
import { Star, AlertCircle, Send, Plus } from "lucide-react";

type ReviewFormProps = {
  submissionId: string;
};

export default function ReviewForm({ submissionId }: ReviewFormProps) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [lineReference, setLineReference] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !rating) {
      setError("Please write review content and select a rating");
      return;
    }
    if (content.length < 30) {
      setError("Review content must be at least 30 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: any = {
        submissionId,
        content,
        rating,
      };

      if (lineReference) {
        payload.lineReference = parseInt(lineReference, 10);
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to submit review");
      } else {
        setSuccess(true);
        setContent("");
        setLineReference("");
        setRating(5);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-lg space-y-5">
      <div className="border-b border-zinc-200/50 pb-3 dark:border-zinc-800/50">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">Submit Peer Feedback</h3>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm">
          Review submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Select (1-5 Star interactive input) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Quality Rating *
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="p-1 rounded-lg transition-transform hover:scale-110 duration-150 focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating
                      ? "text-amber-500 fill-amber-500"
                      : "text-zinc-300 dark:text-zinc-800"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Line reference (optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Line Reference <span className="text-[10px] font-normal text-zinc-400">(Optional)</span>
          </label>
          <input
            type="number"
            min={1}
            value={lineReference}
            onChange={(e) => setLineReference(e.target.value)}
            placeholder="e.g. 42"
            className="w-full max-w-48 px-4 py-2.5 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            Feedback Content *
          </label>
          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write constructive, helpful feedback on code style, formatting, performance, or potential bugs. Minimum 30 characters."
            className="w-full px-4 py-3 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl gradient-bg hover:opacity-90 active:scale-[0.98] transition-all text-white font-semibold text-sm disabled:opacity-50 shadow-md shadow-indigo-500/20"
        >
          {loading ? (
            "Submitting feedback..."
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
}
