"use server";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function incrementViewCount(submissionId: string): Promise<{ newCount: number }> {
  const countKey = `viewcount:${submissionId}`;
  const lastSyncKey = `viewcount:${submissionId}:last_sync`;

  try {
    let cachedViews = await redis.get<number>(countKey);
    if (cachedViews === null) {
      // Find current views from DB
      const sub = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { viewCount: true },
      });
      const dbViews = sub ? sub.viewCount : 0;
      await redis.set(countKey, dbViews);
      cachedViews = dbViews;
    }

    // Atomically increment in Redis
    const newCount = await redis.incr(countKey);

    // Sync check (every 10 views or every 5 minutes)
    const lastSyncTimeStr = await redis.get<string>(lastSyncKey);
    const now = Date.now();
    const lastSyncTime = lastSyncTimeStr ? Number(lastSyncTimeStr) : now;

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

    return { newCount };
  } catch (error) {
    console.error("Failed to increment view count:", error);
    // Return a fallback count if Redis is down
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { viewCount: true },
    });
    return { newCount: sub ? sub.viewCount : 0 };
  }
}

export type FullSubmission = {
  id: string;
  title: string;
  description: string;
  codeContent: string;
  language: string;
  status: string;
  difficultyTag: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    reputation: number;
  };
  reviews: Array<{
    id: string;
    content: string;
    lineReference: number | null;
    rating: number;
    isResolved: boolean;
    createdAt: string;
    updatedAt: string;
    reviewer: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      reputation: number;
    };
  }>;
  votes: Array<{
    id: string;
    voteType: string;
    userId: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  snapshots: Array<{
    id: string;
    imageUrl: string;
    uploadedAt: string;
  }>;
};

export async function getSubmissionWithCache(submissionId: string): Promise<FullSubmission | null> {
  const cacheKey = `cache:submission:${submissionId}`;

  try {
    // 1. Check Redis for a cached version
    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      return parsed as FullSubmission;
    }
  } catch (cacheError) {
    console.error("Redis cache read failed for submission:", cacheError);
  }

  // 2. Fetch from DB
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

  if (!submission) return null;

  // 3. Map to serializable Plain JavaScript Object (PJO) with string dates
  const mapped: FullSubmission = {
    id: submission.id,
    title: submission.title,
    description: submission.description,
    codeContent: submission.codeContent,
    language: submission.language,
    status: submission.status,
    difficultyTag: submission.difficultyTag,
    viewCount: submission.viewCount,
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

  // 4. Store in Redis with a TTL of 120 seconds
  try {
    await redis.set(cacheKey, JSON.stringify(mapped), { ex: 120 });
  } catch (cacheError) {
    console.error("Redis cache write failed for submission:", cacheError);
  }

  return mapped;
}
