import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeLeaderboardScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch all users with reviews, submissions, and the votes received on their submissions
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

    // 2. Compute scores and breakdowns in memory
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
      const reputationPoints = user.reputation * 1.0;
      const reviewBonus = user._count.reviews * 15;
      const submissionBonus = user._count.submissions * 10;
      const voteBonus = netVotesReceived * 2;

      // Use the utility function to compute the leaderboard score
      const score = computeLeaderboardScore({
        reputation: user.reputation,
        totalReviewsGiven: user._count.reviews,
        totalSubmissions: user._count.submissions,
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
          reputationPoints,
          reviewBonus,
          submissionBonus,
          voteBonus,
        },
      };
    });

    // 3. Sort by score descending and take the top 50
    entries.sort((a, b) => b.score - a.score);
    const topEntries = entries.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    const now = new Date();
    const cachedUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes TTL

    return NextResponse.json({
      data: {
        entries: topEntries,
      },
      meta: {
        generatedAt: now.toISOString(),
        cachedUntil: cachedUntil.toISOString(),
      },
    });
  } catch (error) {
    console.error("Leaderboard query failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}
