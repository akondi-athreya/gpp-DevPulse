export default function LeaderboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Title & Subtitle Skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-80 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* Podium Skeleton (Top 3 Users) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {/* Second Place Skeleton */}
        <div className="glass-card rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/40 text-center order-2 md:order-1 h-[250px] flex flex-col justify-center items-center shadow-lg bg-zinc-50/20 dark:bg-zinc-900/10">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg mt-2" />
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
        </div>

        {/* First Place Skeleton */}
        <div className="glass-card rounded-3xl p-8 border border-indigo-500/10 text-center order-1 md:order-2 h-[290px] flex flex-col justify-center items-center shadow-xl bg-zinc-50/20 dark:bg-zinc-900/10">
          <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg mt-2" />
          <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
        </div>

        {/* Third Place Skeleton */}
        <div className="glass-card rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/40 text-center order-3 md:order-3 h-[250px] flex flex-col justify-center items-center shadow-lg bg-zinc-50/20 dark:bg-zinc-900/10">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg mt-2" />
          <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl mt-4" />
        </div>
      </div>

      {/* Leaderboard Table List Skeleton */}
      <div className="glass-card rounded-3xl border border-white/10 dark:border-zinc-800/50 overflow-hidden bg-zinc-50/10 dark:bg-zinc-950/10 p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3.5 border-b border-zinc-100 dark:border-zinc-900/50 last:border-0">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              {/* Name / User */}
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              </div>
            </div>
            {/* Score Points */}
            <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
