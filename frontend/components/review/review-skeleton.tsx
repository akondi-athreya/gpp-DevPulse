"use client";

export default function ReviewsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-20 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
            <div className="w-12 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="w-full h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      ))}
    </div>
  );
}
