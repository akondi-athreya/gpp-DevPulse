import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getUserFromSession } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validations";
import { pusherServer } from "@/lib/pusher";

// Named transaction helper as specified in the PRD
async function createReviewTransaction(
  tx: any,
  data: {
    submissionId: string;
    content: string;
    lineReference: number | null | undefined;
    rating: number;
    reviewerId: string;
    authorId: string;
    submissionTitle: string;
  }
) {
  // 1. Insert the review into the database
  const review = await tx.review.create({
    data: {
      submissionId: data.submissionId,
      reviewerId: data.reviewerId,
      content: data.content,
      lineReference: data.lineReference,
      rating: data.rating,
    },
    include: {
      reviewer: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          reputation: true,
        },
      },
    },
  });

  // 2. Update submission status to UNDER_REVIEW if it was previously PENDING
  const submission = await tx.submission.findUnique({
    where: { id: data.submissionId },
    select: { status: true },
  });

  if (submission && submission.status === "PENDING") {
    await tx.submission.update({
      where: { id: data.submissionId },
      data: { status: "UNDER_REVIEW" },
    });
  }

  // 3. Increment the reviewer's reputation by 10
  await tx.user.update({
    where: { id: data.reviewerId },
    data: { reputation: { increment: 10 } },
  });

  // 4. Create a Notification record for the submission author
  const notification = await tx.notification.create({
    data: {
      userId: data.authorId,
      type: "NEW_REVIEW",
      message: `New review submitted for your submission: "${data.submissionTitle}"`,
      metadata: {
        submissionId: data.submissionId,
        reviewId: review.id,
        reviewerName: review.reviewer.displayName,
      },
    },
  });

  return { review, notification };
}

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const sessionUser = await getUserFromSession(req);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "Authentication required", code: "unauthenticated" },
      { status: 401 }
    );
  }

  // 2. Parse and validate body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "invalid_json" },
      { status: 400 }
    );
  }

  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { submissionId, content, lineReference, rating } = parsed.data;

  try {
    // 3. Fetch submission details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, title: true, authorId: true },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found", code: "not_found" },
        { status: 404 }
      );
    }

    // 4. Prevent a user from reviewing their own submission (return 403)
    if (submission.authorId === sessionUser.id) {
      return NextResponse.json(
        { error: "You cannot review your own submission", code: "self_review_not_allowed" },
        { status: 403 }
      );
    }

    // 5. Prevent duplicate reviews from the same user on the same submission (return 409)
    const existingReview = await prisma.review.findFirst({
      where: {
        submissionId,
        reviewerId: sessionUser.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this submission", code: "review_already_exists" },
        { status: 409 }
      );
    }

    // 6. Run atomic Prisma transaction
    const { review, notification } = await prisma.$transaction(async (tx) => {
      return createReviewTransaction(
        tx,
        {
          submissionId,
          content,
          lineReference,
          rating,
          reviewerId: sessionUser.id,
          authorId: submission.authorId,
          submissionTitle: submission.title,
        }
      );
    });

    // 7. Caching Invalidation: Delete notification count cache for the author
    try {
      await redis.del(`notif:unread:${submission.authorId}`);
    } catch (cacheErr) {
      console.error("Cache invalidation failed:", cacheErr);
    }

    // 8. Trigger real-time notifications via Pusher
    try {
      // Notification to the author
      await pusherServer.trigger(
        `private-user-${submission.authorId}`,
        "new-notification",
        notification
      );

      // Live review prepended on submission details page
      await pusherServer.trigger(
        `submission-${submissionId}`,
        "new-review",
        review
      );
    } catch (pusherErr) {
      console.error("Pusher trigger failed:", pusherErr);
    }

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error("Review creation failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

  const { reviewId, isResolved } = body;
  if (!reviewId || typeof isResolved !== "boolean") {
    return NextResponse.json(
      { error: "Missing or invalid reviewId/isResolved", code: "validation_failed" },
      { status: 400 }
    );
  }

  try {
    // 3. Fetch review with submission info to verify author
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found", code: "not_found" },
        { status: 404 }
      );
    }

    // 4. Only the submission's author may mark a review as resolved
    if (review.submission.authorId !== sessionUser.id) {
      return NextResponse.json(
        { error: "Only the submission author can resolve reviews", code: "unauthorized" },
        { status: 403 }
      );
    }

    // 5. Update review resolution status
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isResolved },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            reputation: true,
          },
        },
      },
    });

    // 6. If resolved is true, create REVIEW_RESOLVED notification for the reviewer
    if (isResolved) {
      const notification = await prisma.notification.create({
        data: {
          userId: review.reviewerId,
          type: "REVIEW_RESOLVED",
          message: `Your review on "${review.submission.title}" has been marked as resolved.`,
          metadata: {
            submissionId: review.submission.id,
            reviewId: review.id,
          },
        },
      });

      // Invalidate count cache for reviewer
      try {
        await redis.del(`notif:unread:${review.reviewerId}`);
      } catch (e) {
        console.error(e);
      }

      // Send real-time notification
      try {
        await pusherServer.trigger(
          `private-user-${review.reviewerId}`,
          "new-notification",
          notification
        );
      } catch (e) {
        console.error(e);
      }
    }

    return NextResponse.json({ data: updatedReview });
  } catch (error) {
    console.error("Resolving review failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}
