"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function FeedError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Feed error boundary caught error:", error);
  }, [error]);

  return (
    <div className="glass-card rounded-3xl p-8 border border-rose-500/20 bg-rose-500/5 text-center space-y-4 max-w-lg mx-auto mt-8">
      <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle className="w-8 h-8" />
      </div>
      
      <div className="space-y-1.5">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
          Failed to load Feed
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          We encountered an issue fetching submissions. Please try reloading the feed.
        </p>
      </div>

      {error.message && (
        <p className="text-xs font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-xl break-all">
          {error.message}
        </p>
      )}

      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-sm transition-all active:scale-[0.98]"
      >
        <RefreshCw className="w-4 h-4" />
        Retry Loading
      </button>
    </div>
  );
}
