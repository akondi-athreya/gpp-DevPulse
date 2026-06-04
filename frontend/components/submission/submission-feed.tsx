"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import SubmissionCard from "./submission-card";
import type { VoteType } from "@/app/generated/prisma/client";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { Filter, SlidersHorizontal, Loader2, ArrowUpDown } from "lucide-react";

type SubmissionFeedProps = {
  initialData: {
    submissions: any[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
};

export default function SubmissionFeed({ initialData }: SubmissionFeedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 1. Derive active filter values from URL Query Parameters
  const filters = {
    status: searchParams.get("status") || "",
    language: searchParams.get("language") || "",
    difficulty: searchParams.get("difficulty") || "",
    sort: searchParams.get("sort") || "newest",
    tag: searchParams.get("tag") || "",
  };

  // Helper to push URL updates
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset pagination on filter change
    router.push(`${pathname}?${params.toString()}` as any);
  };

  // 2. Fetch subsequent pages via React Query useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["submissions", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", "10");
      if (filters.status) params.set("status", filters.status);
      if (filters.language) params.set("language", filters.language);
      if (filters.difficulty) params.set("difficulty", filters.difficulty);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.tag) params.set("tag", filters.tag);

      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.meta?.hasNextPage) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialData: {
      pages: [initialData],
      pageParams: [1],
    },
  });

  // 3. Setup IntersectionObserver for automatic infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 4. Vote Mutation with Optimistic Updates
  const voteMutation = useMutation({
    mutationFn: async ({ submissionId, voteType }: { submissionId: string; voteType: VoteType }) => {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, voteType }),
      });
      if (!res.ok) throw new Error("Vote failed");
      return res.json();
    },
    onMutate: async ({ submissionId, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ["submissions", filters] });
      const previousData = queryClient.getQueryData(["submissions", filters]);

      queryClient.setQueryData(["submissions", filters], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page.data,
              submissions: page.data.submissions.map((sub: any) => {
                if (sub.id !== submissionId) return sub;

                const oldVote = sub.userVote;
                let newVote: VoteType | null = voteType;
                let voteCountChange = 0;

                if (oldVote === null) {
                  newVote = voteType;
                  voteCountChange = 1;
                } else if (oldVote === voteType) {
                  newVote = null;
                  voteCountChange = -1;
                } else {
                  newVote = voteType;
                  voteCountChange = 0; // voteType flipped, count stays the same (wait, total vote count is sum of votes)
                }

                return {
                  ...sub,
                  userVote: newVote,
                  _count: {
                    ...sub._count,
                    votes: Math.max(0, sub._count.votes + voteCountChange),
                  },
                };
              }),
            },
          })),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["submissions", filters], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", filters] });
    },
  });

  const handleVote = (submissionId: string, voteType: VoteType) => {
    voteMutation.mutate({ submissionId, voteType });
  };

  const submissions = data?.pages.flatMap((page) => page.data.submissions) || [];

  return (
    <div className="space-y-6">
      {/* Filter Controls Bar */}
      <div className="glass-card rounded-3xl p-5 border border-white/10 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-zinc-500 text-sm font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <span>Filters:</span>
          </div>

          {/* Language filter */}
          <select
            value={filters.language}
            onChange={(e) => updateFilter("language", e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">All Languages</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Difficulty filter */}
          <select
            value={filters.difficulty}
            onChange={(e) => updateFilter("difficulty", e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="EXPERT">Expert</option>
          </select>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-purple-500" />
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_voted">Most Voted</option>
            <option value="most_reviewed">Most Reviewed</option>
          </select>
        </div>
      </div>

      {/* Feed Cards List */}
      <div className="space-y-4">
        {(status as string) === "pending" ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">Loading code submissions...</p>
          </div>
        ) : status === "error" ? (
          <div className="p-6 text-center text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
            An error occurred while loading submissions. Please try again.
          </div>
        ) : submissions.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center text-zinc-500 dark:text-zinc-400">
            <Filter className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-bold">No Submissions Found</h3>
            <p className="text-sm mt-1">Try resetting your filters or submit a new review request!</p>
          </div>
        ) : (
          submissions.map((sub: any) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              onVote={handleVote}
            />
          ))
        )}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Loading more submissions...</span>
            </div>
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="px-6 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
