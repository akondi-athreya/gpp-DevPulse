import { prisma } from "@/lib/prisma";
import { getContributionData } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Award, Code, MessageSquare, Flame, Check, HelpCircle, Eye } from "lucide-react";
import Link from "next/link";

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { displayName: true },
  });

  if (!user) return {};

  return {
    title: `${user.displayName}'s Profile - DevPulse`,
    description: `View contribution history, reputation, and code reviews for ${user.displayName} on DevPulse.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // 1. Fetch user profile with submissions
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      submissions: {
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              votes: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          reviews: true,
          submissions: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // 2. Compute profile metrics
  const totalReviewsGiven = user._count.reviews;
  const totalSubmissions = user._count.submissions;
  
  // Calculate total votes received across all submissions
  let totalVotesReceived = 0;
  for (const sub of user.submissions) {
    const votesCount = await prisma.vote.count({
      where: { submissionId: sub.id },
    });
    totalVotesReceived += votesCount;
  }

  // 3. Compute 30-day activity contribution data
  const contributionDays = await getContributionData(user.id);

  // Helper function to colorize cells based on contribution count
  const getContributionColor = (count: number) => {
    if (count === 0) return "bg-zinc-100 dark:bg-zinc-900/60";
    if (count <= 1) return "bg-indigo-200 dark:bg-indigo-950/40 text-indigo-400";
    if (count <= 3) return "bg-indigo-400 dark:bg-indigo-800/60 text-indigo-200";
    return "bg-indigo-600 dark:bg-indigo-600 text-indigo-50"; // high activity
  };

  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <div className="glass-card rounded-3xl p-8 border border-white/10 relative shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 gradient-bg" />
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-20 h-20 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-md"
            />
          ) : (
            <div className="flex w-20 h-20 items-center justify-center rounded-full bg-indigo-500 text-white text-3xl font-extrabold shadow-md">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{user.displayName}</h2>
            <p className="text-sm text-zinc-400">@{user.username}</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              {user.githubId && (
                <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Linked Github
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                Senior Contributor
              </span>
            </div>
          </div>

          {/* Reputation Stats Box */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-4 min-w-36 text-center shadow-inner">
            <Flame className="w-8 h-8 text-orange-500 mx-auto animate-pulse" />
            <div className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mt-2">{user.reputation}</div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Reputation</p>
          </div>
        </div>
      </div>

      {/* Grid: 30-Day Contribution Graph & Stats Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contribution Graph */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-white/10 shadow-md">
          <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-4">Last 30 Days Activity</h3>
          
          <div className="flex flex-col items-center justify-center p-4">
            {/* Grid of squares */}
            <div className="grid grid-cols-10 gap-2.5">
              {contributionDays.map((day) => (
                <div
                  key={day.date}
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-semibold transition-all duration-200 hover:scale-110 ${getContributionColor(day.count)}`}
                  title={`${day.count} activities on ${day.date}`}
                >
                  <span>{day.count}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 items-center justify-center text-xs text-zinc-400 mt-6 w-full border-t border-zinc-100 dark:border-zinc-900/50 pt-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-900/60 inline-block border border-zinc-200/50 dark:border-zinc-800/50" /> No activity</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-200 dark:bg-indigo-950/40 inline-block" /> Low activity</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-400 dark:bg-indigo-800/60 inline-block" /> Medium</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-600 dark:bg-indigo-600 inline-block" /> High</span>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-md space-y-6 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider">Metrics Overview</h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Submissions Count */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-900/40">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Code className="w-4 h-4 text-indigo-500" />
                <span>Code Submissions</span>
              </div>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalSubmissions}</span>
            </div>

            {/* Reviews Count */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-900/40">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span>Peer Reviews Given</span>
              </div>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalReviewsGiven}</span>
            </div>

            {/* Votes Count */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Feedback Votes Received</span>
              </div>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalVotesReceived}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission History List */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-md">
        <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-6">Published Submissions History</h3>
        
        <div className="space-y-4">
          {user.submissions.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No submissions published by this user.
            </div>
          ) : (
            user.submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/20 border border-zinc-200/20 dark:border-zinc-800/20 transition-colors"
              >
                <div className="min-w-0">
                  <Link href={`/review/${sub.id}`} className="font-bold text-sm text-zinc-800 hover:text-indigo-500 dark:text-zinc-200 dark:hover:text-indigo-400 line-clamp-1">
                    {sub.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-400">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400 text-[9px] font-semibold">
                      {sub.language}
                    </span>
                    <span>•</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5" title={`${sub._count.reviews} reviews`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{sub._count.reviews}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title={`${sub.viewCount} views`}>
                    <Eye className="w-3.5 h-3.5" />
                    <span>{sub.viewCount}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
