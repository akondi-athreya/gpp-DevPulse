import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import SubmissionFeed from "@/components/submission/submission-feed";
import { SubmissionStatus, DifficultyTag } from "@/app/generated/prisma/client";

type FeedPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    language?: string;
    difficulty?: string;
    sort?: string;
    tag?: string;
  }>;
};

export async function generateMetadata({ searchParams }: FeedPageProps) {
  const resolvedParams = await searchParams;
  let description = "Browse all code review submissions and share feedback with peers.";

  if (resolvedParams.language) {
    description += ` Language filter: ${resolvedParams.language}.`;
  }
  if (resolvedParams.difficulty) {
    description += ` Level: ${resolvedParams.difficulty.toLowerCase()}.`;
  }
  if (resolvedParams.status) {
    description += ` Status: ${resolvedParams.status.replace("_", " ").toLowerCase()}.`;
  }

  return {
    title: "DevPulse - Code Review Feed",
    description,
  };
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const resolvedParams = await searchParams;

  // 1. Authenticate user on Server
  const sessionUser = await getServerSession();
  const authenticatedUserId = sessionUser?.user?.id || null;

  // 2. Parse pagination filters
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(resolvedParams.limit || "10", 10) || 10));

  // 3. Build Prisma where clause
  const where: any = {};
  if (resolvedParams.status && Object.values(SubmissionStatus).includes(resolvedParams.status as SubmissionStatus)) {
    where.status = resolvedParams.status as SubmissionStatus;
  }
  if (resolvedParams.language) {
    where.language = {
      equals: resolvedParams.language,
      mode: "insensitive",
    };
  }
  if (resolvedParams.difficulty && Object.values(DifficultyTag).includes(resolvedParams.difficulty as DifficultyTag)) {
    where.difficultyTag = resolvedParams.difficulty as DifficultyTag;
  }
  if (resolvedParams.tag) {
    where.tags = {
      some: {
        tag: {
          name: {
            equals: resolvedParams.tag,
            mode: "insensitive",
          },
        },
      },
    };
  }

  // 4. Configure sorting orderBy
  let orderBy: any = { createdAt: "desc" };
  if (resolvedParams.sort === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (resolvedParams.sort === "most_voted") {
    orderBy = { votes: { _count: "desc" } };
  } else if (resolvedParams.sort === "most_reviewed") {
    orderBy = { reviews: { _count: "desc" } };
  }

  const total = await prisma.submission.count({ where });
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  // 5. Query options (with user specific vote subqueries if authenticated)
  const rawSubmissions = await prisma.submission.findMany({
    where,
    include: {
      author: true,
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
      votes: {
        where: {
          userId: authenticatedUserId || "non-existent-user-id",
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  });

  // 6. Map Prisma data to match final serializable layout
  const submissions = rawSubmissions.map((sub) => {
    const userVote =
      authenticatedUserId && sub.votes && sub.votes.length > 0
        ? sub.votes[0].voteType
        : null;

    return {
      id: sub.id,
      title: sub.title,
      description: sub.description,
      language: sub.language,
      status: sub.status,
      difficultyTag: sub.difficultyTag,
      viewCount: sub.viewCount,
      createdAt: sub.createdAt.toISOString(),
      author: {
        id: sub.author.id,
        username: sub.author.username,
        displayName: sub.author.displayName,
        avatarUrl: sub.author.avatarUrl,
        reputation: sub.author.reputation,
      },
      _count: {
        reviews: sub._count.reviews,
        votes: sub._count.votes,
      },
      tags: sub.tags.map((st: any) => ({
        id: st.tag.id,
        name: st.tag.name,
        color: st.tag.color,
      })),
      userVote,
    };
  });

  const initialData = {
    submissions,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Developer Code Feed
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review code submissions, rate quality, and submit your peer reviews.
          </p>
        </div>
      </div>

      <SubmissionFeed initialData={initialData} />
    </div>
  );
}
