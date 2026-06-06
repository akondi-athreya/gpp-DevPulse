import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubmissionWithCache, incrementViewCount } from "@/app/actions/submission-actions";
import { getServerSession } from "@/lib/auth";
import ReviewList from "@/components/review/review-list";
import ReviewForm from "@/components/review/review-form";
import ReviewsSkeleton from "@/components/review/review-skeleton";
import CodeViewer from "@/components/submission/code-viewer";
import { Eye, Calendar, Award, Code, CornerDownRight } from "lucide-react";

type ReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

// 2. Reviews Section wrapper for Suspense boundary streaming
async function ReviewsSection({ submissionId, isAuthor }: { submissionId: string; isAuthor: boolean }) {
  // Fetch reviews directly from DB to allow Suspense to stream this component
  const dbSubmission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      reviews: {
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
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const reviews = dbSubmission
    ? dbSubmission.reviews.map((rev) => ({
        ...rev,
        createdAt: rev.createdAt.toISOString(),
        updatedAt: rev.updatedAt.toISOString(),
      }))
    : [];

  return <ReviewList submissionId={submissionId} initialReviews={reviews as any} isAuthor={isAuthor} />;
}

export default async function ReviewDetailPage({ params }: ReviewPageProps) {
  const { id: submissionId } = await params;

  // Authenticate user
  const sessionUser = await getServerSession();
  if (!sessionUser) {
    redirect("/login");
  }

  // 3. Atomically increment view count inside Server Actions
  const { newCount } = await incrementViewCount(submissionId);

  // 4. Fetch submission metadata from cache/DB
  const submission = await getSubmissionWithCache(submissionId);
  if (!submission) {
    notFound();
  }

  const isAuthor = submission.author.id === sessionUser.user.id;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 uppercase tracking-wider">
              {submission.language}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2">
              {submission.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2.5">
              <span>Submitted by <b>{submission.author.displayName}</b> (@{submission.author.username})</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{newCount} views</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-500">
            <Award className="w-4 h-4 text-glow" />
            <span>Difficulty: {submission.difficultyTag}</span>
          </div>
        </div>
      </div>

      {/* Grid: Details and Review Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main code content and description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Context Card */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-md">
            <h3 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-3">Context & Details</h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {submission.description}
            </p>
          </div>

          {/* Code Viewer */}
          <CodeViewer codeContent={submission.codeContent} language={submission.language} />
        </div>

        {/* Sidebar: Review Submission and Feed */}
        <div className="space-y-6">
          {/* Prevent self reviews submission */}
          {!isAuthor && <ReviewForm submissionId={submissionId} />}

          {/* List of reviews wrapped in Suspense streaming */}
          <Suspense fallback={<ReviewsSkeleton />}>
            <ReviewsSection submissionId={submissionId} isAuthor={isAuthor} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
