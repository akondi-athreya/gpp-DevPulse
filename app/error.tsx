"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 glass-card rounded-3xl shadow-2xl relative overflow-hidden border border-white/20 dark:border-zinc-800/40 text-center space-y-6 bg-white/50 dark:bg-zinc-950/50">
        {/* Decorative gradient spheres */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative space-y-6">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shadow-inner">
            <AlertCircle className="w-12 h-12" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Something went wrong
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              An unexpected error occurred while loading this page. Our team has been notified.
            </p>
          </div>

          {/* Error Message Details */}
          {error.message && (
            <div className="p-3.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 text-xs font-mono text-zinc-500 dark:text-zinc-400 break-all text-left">
              Error: {error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white font-semibold shadow-lg shadow-indigo-500/25 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/feed"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all text-zinc-700 dark:text-zinc-300 font-semibold text-sm border border-zinc-200/50 dark:border-zinc-800/50"
            >
              <Home className="w-4 h-4" />
              Go to Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
