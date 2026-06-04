"use client";

import Link from "next/link";
import type { VoteType } from "@/app/generated/prisma/client";
import { MessageSquare, Eye, ChevronUp, ChevronDown, Calendar, Tag } from "lucide-react";

export type SubmissionCardProps = {
  submission: {
    id: string;
    title: string;
    description: string;
    language: string;
    status: string;
    difficultyTag: string;
    viewCount: number;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      reputation: number;
    };
    _count: {
      reviews: number;
      votes: number;
    };
    tags: Array<{
      id: string;
      name: string;
      color: string;
    }>;
    userVote: VoteType | null;
  };
  onVote: (submissionId: string, voteType: VoteType) => void;
};

export default function SubmissionCard({ submission, onVote }: SubmissionCardProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "BEGINNER":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "INTERMEDIATE":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "ADVANCED":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20";
      case "EXPERT":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20";
      case "UNDER_REVIEW":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20";
      case "REVIEWED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "CLOSED":
        return "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20";
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] flex gap-5 border border-white/10">
      {/* Side Voting Column */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <button
          onClick={() => onVote(submission.id, "UPVOTE" as VoteType)}
          className={`p-2 rounded-xl transition-all duration-200 ${
            submission.userVote === "UPVOTE"
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
              : "text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          }`}
          title="Upvote"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        <span className="text-sm font-bold tracking-tight text-zinc-700 dark:text-zinc-300 min-w-8 text-center">
          {submission._count.votes}
        </span>

        <button
          onClick={() => onVote(submission.id, "DOWNVOTE" as VoteType)}
          className={`p-2 rounded-xl transition-all duration-200 ${
            submission.userVote === "DOWNVOTE"
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
              : "text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          }`}
          title="Downvote"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Tags / Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getDifficultyColor(submission.difficultyTag)}`}>
              {submission.difficultyTag}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(submission.status)}`}>
              {submission.status.replace("_", " ")}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50">
              {submission.language}
            </span>
          </div>

          {/* Title */}
          <Link href={`/review/${submission.id}`} className="group block">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400 transition-colors line-clamp-1">
              {submission.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
            {submission.description}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900/50 text-xs text-zinc-500">
          {/* Author Panel */}
          <div className="flex items-center gap-2">
            {submission.author.avatarUrl ? (
              <img
                src={submission.author.avatarUrl}
                alt={submission.author.displayName}
                className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div className="flex w-6 h-6 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold">
                {submission.author.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {submission.author.displayName}
            </span>
            <span className="text-[10px] text-zinc-400">@{submission.author.username}</span>
          </div>

          {/* Submittals Date & Custom tags */}
          <div className="flex items-center gap-4">
            {submission.tags.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <div className="flex items-center gap-1">
                  {submission.tags.slice(0, 2).map((t) => (
                    <span
                      key={t.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                    >
                      {t.name}
                    </span>
                  ))}
                  {submission.tags.length > 2 && (
                    <span className="text-[9px] text-zinc-400">+{submission.tags.length - 2}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-1.5" title={`${submission._count.reviews} reviews`}>
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span>{submission._count.reviews}</span>
            </div>

            <div className="flex items-center gap-1.5" title={`${submission.viewCount} views`}>
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>{submission.viewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
