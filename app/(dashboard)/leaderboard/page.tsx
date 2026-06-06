import { prisma } from "@/lib/prisma";
import { computeLeaderboardScore } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { Trophy, Medal, Award, Flame, MessageSquare, Code, ThumbsUp } from "lucide-react";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

// Define the cached query as specified in the PRD
export const getCachedLeaderboard = unstable_cache(
  async () => {
    const users = await prisma.user.findMany({
      include: {
        submissions: {
          select: {
            votes: {
              select: {
                voteType: true,
              },
            },
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

    const entries = users.map((user) => {
      let upvotes = 0;
      let downvotes = 0;

      for (const sub of user.submissions) {
        for (const vote of sub.votes) {
          if (vote.voteType === "UPVOTE") {
            upvotes++;
          } else if (vote.voteType === "DOWNVOTE") {
            downvotes++;
          }
        }
      }

      const netVotesReceived = upvotes - downvotes;
      const score = computeLeaderboardScore({
        reputation: user.reputation,
        totalReviewsGiven: user._count.reviews,
        totalSubmissions: user.submissions.length,
        netVotesReceived,
      });

      return {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          reputation: user.reputation,
        },
        score,
        breakdown: {
          reputationPoints: user.reputation * 1.0,
          reviewBonus: user._count.reviews * 15,
          submissionBonus: user.submissions.length * 10,
          voteBonus: netVotesReceived * 2,
        },
      };
    });

    entries.sort((a, b) => b.score - a.score);
    return entries.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  },
  ["leaderboard"],
  {
    revalidate: 300,
    tags: ["leaderboard"],
  }
);

export const metadata = {
  title: "DevPulse Leaderboard - Top Contributors",
  description: "Rankings and reputation stats for top code reviewers and developers on DevPulse.",
};

export default async function LeaderboardPage() {
  // Protect page
  const sessionUser = await getServerSession();
  if (!sessionUser) {
    redirect("/login");
  }

  const entries = await getCachedLeaderboard();

  // Top 3 Podium Users
  const podium = entries.slice(0, 3);
  const remaining = entries.slice(3);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-amber-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-zinc-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="font-bold text-zinc-400 w-6 text-center">{rank}</span>;
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Top Contributors Leaderboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Rankings are calculated based on user reputation, submissions published, and peer reviews submitted.
        </p>
      </div>

      {/* Podium (Top 3 Users cards layout) */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Second Place */}
          {podium[1] && (
            <div className="glass-card rounded-3xl p-6 border-zinc-200/60 dark:border-zinc-800/40 text-center order-2 md:order-1 h-[250px] flex flex-col justify-center items-center shadow-lg hover:translate-y-[-2px] transition-transform">
              <div className="relative">
                <Medal className="w-10 h-10 text-zinc-400 mx-auto" />
                <span className="absolute -top-1 -right-1 bg-zinc-400 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">2</span>
              </div>
              <h3 className="font-bold mt-4 text-lg text-zinc-900 dark:text-zinc-100">{podium[1].user.displayName}</h3>
              <p className="text-xs text-zinc-400">@{podium[1].user.username}</p>
              <div className="mt-4 text-2xl font-extrabold text-zinc-700 dark:text-zinc-300">{podium[1].score.toFixed(2)}</div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mt-1">Points</p>
            </div>
          )}

          {/* First Place */}
          {podium[0] && (
            <div className="glass-card rounded-3xl p-8 border-indigo-500/20 dark:border-indigo-500/10 text-center order-1 md:order-2 h-[290px] flex flex-col justify-center items-center shadow-xl ring-2 ring-indigo-500/10 hover:translate-y-[-2px] transition-transform relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 gradient-bg" />
              <div className="relative">
                <Trophy className="w-14 h-14 text-amber-500 mx-auto animate-bounce duration-1000" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full text-xs w-6 h-6 flex items-center justify-center font-bold">1</span>
              </div>
              <h3 className="font-extrabold mt-4 text-xl bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">{podium[0].user.displayName}</h3>
              <p className="text-xs text-zinc-400">@{podium[0].user.username}</p>
              <div className="mt-4 text-3xl font-black text-indigo-600 dark:text-indigo-400">{podium[0].score.toFixed(2)}</div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 mt-1">Champion Points</p>
            </div>
          )}

          {/* Third Place */}
          {podium[2] && (
            <div className="glass-card rounded-3xl p-6 border-zinc-200/60 dark:border-zinc-800/40 text-center order-3 h-[230px] flex flex-col justify-center items-center shadow-lg hover:translate-y-[-2px] transition-transform">
              <div className="relative">
                <Medal className="w-10 h-10 text-amber-700 mx-auto" />
                <span className="absolute -top-1 -right-1 bg-amber-700 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">3</span>
              </div>
              <h3 className="font-bold mt-4 text-lg text-zinc-900 dark:text-zinc-100">{podium[2].user.displayName}</h3>
              <p className="text-xs text-zinc-400">@{podium[2].user.username}</p>
              <div className="mt-4 text-2xl font-extrabold text-zinc-700 dark:text-zinc-300">{podium[2].score.toFixed(2)}</div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 mt-1">Points</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <th className="py-4 px-6 text-center w-16">Rank</th>
                <th className="py-4 px-6">Contributor</th>
                <th className="py-4 px-6 text-center">Score</th>
                <th className="py-4 px-6 text-center">Reputation</th>
                <th className="py-4 px-6 text-center">Reviews</th>
                <th className="py-4 px-6 text-center">Submissions</th>
                <th className="py-4 px-6 text-center">Net Votes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50 text-sm">
              {entries.map((entry) => (
                <tr key={entry.user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                  {/* Rank */}
                  <td className="py-4.5 px-6 text-center">{getRankBadge(entry.rank)}</td>
                  
                  {/* User Profile */}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-3">
                      {entry.user.avatarUrl ? (
                        <img src={entry.user.avatarUrl} alt={entry.user.displayName} className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800" />
                      ) : (
                        <div className="flex w-8 h-8 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">
                          {entry.user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200">{entry.user.displayName}</h4>
                        <span className="text-[10px] text-zinc-400">@{entry.user.username}</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Score */}
                  <td className="py-4.5 px-6 text-center font-extrabold text-indigo-600 dark:text-indigo-400">
                    {entry.score.toFixed(2)}
                  </td>
                  
                  {/* Reputation */}
                  <td className="py-4.5 px-6 text-center text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span>{entry.breakdown.reputationPoints.toFixed(0)}</span>
                    </div>
                  </td>

                  {/* Reviews Given */}
                  <td className="py-4.5 px-6 text-center text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{entry.breakdown.reviewBonus / 15}</span>
                    </div>
                  </td>

                  {/* Submissions Created */}
                  <td className="py-4.5 px-6 text-center text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center justify-center gap-1">
                      <Code className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{entry.breakdown.submissionBonus / 10}</span>
                    </div>
                  </td>

                  {/* Net Votes Received */}
                  <td className="py-4.5 px-6 text-center text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center justify-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{entry.breakdown.voteBonus / 2}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No leaderboard data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
