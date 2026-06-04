import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth";
import { resolveVoteAction } from "@/lib/utils";
import { VoteType } from "@/app/generated/prisma/client";

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const sessionUser = await getUserFromSession(req);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "Authentication required", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // 2. Parse request body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "invalid_json" },
      { status: 400 }
    );
  }

  const { submissionId, voteType } = body;
  if (!submissionId || !voteType || !Object.values(VoteType).includes(voteType)) {
    return NextResponse.json(
      { error: "Missing or invalid submissionId/voteType", code: "validation_failed" },
      { status: 400 }
    );
  }

  try {
    // 3. Fetch submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found", code: "not_found" },
        { status: 404 }
      );
    }

    // 4. Reject voting on own submission
    if (submission.authorId === sessionUser.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own submission", code: "self_voting_not_allowed" },
        { status: 403 }
      );
    }

    // 5. Fetch existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        submissionId_userId: {
          submissionId,
          userId: sessionUser.id,
        },
      },
    });

    const voteResolution = resolveVoteAction(existingVote, voteType);
    const { action } = voteResolution;

    // Calculate reputation changes based on transition state
    let reputationChange = 0;
    if (action === "create") {
      reputationChange = voteType === "UPVOTE" ? 2 : -1;
    } else if (action === "update") {
      reputationChange = voteType === "UPVOTE" ? 3 : -3;
    } else if (action === "delete") {
      reputationChange = existingVote?.voteType === "UPVOTE" ? -2 : 1;
    }

    // 6. Database Transaction
    await prisma.$transaction(async (tx) => {
      // Modify vote record
      if (action === "create") {
        await tx.vote.create({
          data: {
            submissionId,
            userId: sessionUser.id,
            voteType,
          },
        });
      } else if (action === "update") {
        await tx.vote.update({
          where: {
            submissionId_userId: {
              submissionId,
              userId: sessionUser.id,
            },
          },
          data: {
            voteType,
          },
        });
      } else if (action === "delete") {
        await tx.vote.delete({
          where: {
            submissionId_userId: {
              submissionId,
              userId: sessionUser.id,
            },
          },
        });
      }

      // Update author reputation
      const author = await tx.user.findUnique({
        where: { id: submission.authorId },
        select: { reputation: true },
      });

      if (author) {
        const newRep = Math.max(0, author.reputation + reputationChange);
        await tx.user.update({
          where: { id: submission.authorId },
          data: { reputation: newRep },
        });
      }
    });

    // 7. Get final counts
    const upvoteCount = await prisma.vote.count({
      where: { submissionId, voteType: "UPVOTE" },
    });
    const downvoteCount = await prisma.vote.count({
      where: { submissionId, voteType: "DOWNVOTE" },
    });

    return NextResponse.json({
      data: {
        submissionId,
        userVote: action === "delete" ? null : voteType,
        upvoteCount,
        downvoteCount,
      },
    });
  } catch (error) {
    console.error("Voting failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}
