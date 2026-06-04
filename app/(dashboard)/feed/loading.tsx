export default function FeedLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title & Subtitle Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* Filter Controls Bar Skeleton */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 dark:border-zinc-800/50 flex flex-wrap gap-4 items-center justify-between shadow-sm bg-zinc-50/50 dark:bg-zinc-950/20">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
        <div className="h-8 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* Feed Cards List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card rounded-3xl p-6 border border-white/10 dark:border-zinc-800/50 flex gap-5 bg-zinc-50/20 dark:bg-zinc-900/10"
          >
            {/* Voting Column Skeleton */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-6 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Content Area Skeleton */}
            <div className="flex-1 space-y-4">
              <div>
                {/* Tags */}
                <div className="flex gap-2 mb-3">
                  <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </div>
                {/* Title */}
                <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                {/* Description */}
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded-xl mt-2.5" />
                <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl mt-1.5" />
              </div>

              {/* Card Footer Metadata */}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-900/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>
                <div className="flex gap-4">
                  <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
