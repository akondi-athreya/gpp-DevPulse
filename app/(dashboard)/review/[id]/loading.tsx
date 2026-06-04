export default function ReviewDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Info Skeleton */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-900/10 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-7 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4 w-1/2 bg-zinc-100 dark:bg-zinc-900/60 rounded-lg" />
          </div>
          <div className="h-8 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>
      </div>

      {/* Grid: Details and Review Actions Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main code content and description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Context Card Skeleton */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-900/10 shadow-md space-y-3">
            <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded-xl" />
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded-xl" />
              <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-900/60 rounded-xl" />
            </div>
          </div>

          {/* Code Viewer Skeleton */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950/40 overflow-hidden shadow-lg space-y-4">
            <div className="h-10 bg-zinc-900/80 border-b border-zinc-800 flex items-center px-4">
              <div className="h-4 w-28 bg-zinc-800 rounded-lg" />
            </div>
            <div className="p-5 space-y-2">
              <div className="h-3 w-1/3 bg-zinc-800 rounded" />
              <div className="h-3 w-1/2 bg-zinc-800 rounded" />
              <div className="h-3 w-2/3 bg-zinc-800 rounded" />
              <div className="h-3 w-1/4 bg-zinc-800 rounded" />
              <div className="h-3 w-3/4 bg-zinc-800 rounded" />
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-6">
          {/* Review Form Skeleton */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-900/10 shadow-md space-y-4">
            <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-24 bg-zinc-100 dark:bg-zinc-900/60 rounded-2xl" />
            <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
          </div>

          {/* Reviews List Skeleton */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 dark:border-zinc-800/50 bg-zinc-50/20 dark:bg-zinc-900/10 shadow-md space-y-4">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-900/50 first:border-0 first:pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                  </div>
                  <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                </div>
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
