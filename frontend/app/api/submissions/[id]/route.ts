import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getUserFromSession } from "@/lib/auth";
import { SubmissionStatus, DifficultyTag } from "@/app/generated/prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: submissionId } = await params;

  try {
    // 1. Fetch submission with all associated relations
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true,
        reviews: {
          include: {
            reviewer: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        votes: true,
        tags: {
          include: {
            tag: true,
          },
        },
        snapshots: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found", code: "not_found" },
        { status: 404 }
      );
    }

    // 2. View Count Tracking using Redis
    const countKey = `viewcount:${submissionId}`;
    const lastSyncKey = `viewcount:${submissionId}:last_sync`;

    let cachedViews = await redis.get<number>(countKey);
    if (cachedViews === null) {
      // If not cached, initialize with the current DB views
      const dbViews = submission.viewCount;
      await redis.set(countKey, dbViews);
      cachedViews = dbViews;
    }

    // Increment atomically in Redis
    const newCount = await redis.incr(countKey);

    // Sync to PostgreSQL if 10 views have accumulated or 5 minutes have passed
    let lastSyncTimeStr = await redis.get<string>(lastSyncKey);
    const now = Date.now();
    let lastSyncTime = lastSyncTimeStr ? Number(lastSyncTimeStr) : now;

    if (!lastSyncTimeStr) {
      await redis.set(lastSyncKey, String(now));
    }

    const shouldSyncByCount = newCount % 10 === 0;
    const shouldSyncByTime = now - lastSyncTime >= 5 * 60 * 1000;

    if (shouldSyncByCount || shouldSyncByTime) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { viewCount: newCount },
      });
      await redis.set(lastSyncKey, String(now));
    }

    // 3. Map to consistent API structure
    const responseData = {
      id: submission.id,
      title: submission.title,
      description: submission.description,
      codeContent: submission.codeContent,
      language: submission.language,
      status: submission.status,
      difficultyTag: submission.difficultyTag,
      viewCount: newCount,
      createdAt: submission.createdAt.toISOString(),
      updatedAt: submission.updatedAt.toISOString(),
      author: {
        id: submission.author.id,
        username: submission.author.username,
        displayName: submission.author.displayName,
        avatarUrl: submission.author.avatarUrl,
        reputation: submission.author.reputation,
      },
      reviews: submission.reviews.map((rev) => ({
        id: rev.id,
        content: rev.content,
        lineReference: rev.lineReference,
        rating: rev.rating,
        isResolved: rev.isResolved,
        createdAt: rev.createdAt.toISOString(),
        updatedAt: rev.updatedAt.toISOString(),
        reviewer: {
          id: rev.reviewer.id,
          username: rev.reviewer.username,
          displayName: rev.reviewer.displayName,
          avatarUrl: rev.reviewer.avatarUrl,
          reputation: rev.reviewer.reputation,
        },
      })),
      votes: submission.votes.map((v) => ({
        id: v.id,
        voteType: v.voteType,
        userId: v.userId,
      })),
      tags: submission.tags.map((st: any) => ({
        id: st.tag.id,
        name: st.tag.name,
        color: st.tag.color,
      })),
      snapshots: submission.snapshots.map((snap) => ({
        id: snap.id,
        imageUrl: snap.imageUrl,
        uploadedAt: snap.uploadedAt.toISOString(),
      })),
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Failed to fetch submission:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id: submissionId } = await params;

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

  // 3. Find submission and check author
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found", code: "not_found" },
      { status: 404 }
    );
  }

  if (submission.authorId !== sessionUser.id) {
    return NextResponse.json(
      { error: "Only the author can update their submission", code: "unauthorized" },
      { status: 403 }
    );
  }

  // 4. Validate updatable fields (only title, description, codeContent, status)
  const allowedFields = ["title", "description", "codeContent", "status"];
  const updates: any = {};

  for (const key of Object.keys(body)) {
    if (!allowedFields.includes(key)) {
      return NextResponse.json(
        { error: `Field '${key}' is not allowed to be updated`, code: "bad_request" },
        { status: 400 }
      );
    }
    updates[key] = body[key];
  }

  // Type checks for updates
  if (updates.status && !Object.values(SubmissionStatus).includes(updates.status)) {
    return NextResponse.json(
      { error: "Invalid status value", code: "validation_failed" },
      { status: 400 }
    );
  }

  try {
    // 5. Perform the update
    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: updates,
      include: {
        author: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Invalidate Cache for submissions feed
    try {
      const keys = await redis.keys("cache:submissions:*");
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (cacheErr) {
      console.error(cacheErr);
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Failed to update submission:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id: submissionId } = await params;

  // 1. Authenticate user
  const sessionUser = await getUserFromSession(req);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "Authentication required", code: "unauthenticated" },
      { status: 401 }
    );
  }

  try {
    // 2. Find submission and check author
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found", code: "not_found" },
        { status: 404 }
      );
    }

    if (submission.authorId !== sessionUser.id) {
      return NextResponse.json(
        { error: "Only the author can delete their submission", code: "unauthorized" },
        { status: 403 }
      );
    }

    // 3. Cascade deletes inside a single Prisma transaction
    await prisma.$transaction(async (tx) => {
      // Delete reviews
      await tx.review.deleteMany({
        where: { submissionId },
      });
      // Delete votes
      await tx.vote.deleteMany({
        where: { submissionId },
      });
      // Delete submission tags mappings
      await tx.submissionTag.deleteMany({
        where: { submissionId },
      });
      // Delete code snapshots
      await tx.codeSnapshot.deleteMany({
        where: { submissionId },
      });
      // Delete submission itself
      await tx.submission.delete({
        where: { id: submissionId },
      });
    });

    // 4. Invalidate Cache
    try {
      const keys = await redis.keys("cache:submissions:*");
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (cacheErr) {
      console.error(cacheErr);
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("Failed to delete submission:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}
