import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {},
  };
});

import { resolveVoteAction } from "@/lib/utils";
import { VoteType, Vote } from "@/app/generated/prisma/client";

describe("resolveVoteAction", () => {
  it("should return create action when there is no existing vote", () => {
    const result = resolveVoteAction(null, VoteType.UPVOTE);
    expect(result).toEqual({ action: "create", voteType: VoteType.UPVOTE });

    const resultDown = resolveVoteAction(null, VoteType.DOWNVOTE);
    expect(resultDown).toEqual({ action: "create", voteType: VoteType.DOWNVOTE });
  });

  it("should return delete action when the existing vote has the same type", () => {
    const existingVote: Vote = {
      id: "vote-1",
      voteType: VoteType.UPVOTE,
      submissionId: "sub-1",
      userId: "user-1",
      createdAt: new Date(),
    };

    const result = resolveVoteAction(existingVote, VoteType.UPVOTE);
    expect(result).toEqual({ action: "delete" });

    const existingVoteDown: Vote = {
      id: "vote-2",
      voteType: VoteType.DOWNVOTE,
      submissionId: "sub-1",
      userId: "user-1",
      createdAt: new Date(),
    };

    const resultDown = resolveVoteAction(existingVoteDown, VoteType.DOWNVOTE);
    expect(resultDown).toEqual({ action: "delete" });
  });

  it("should return update action when the existing vote has a different type", () => {
    const existingVote: Vote = {
      id: "vote-1",
      voteType: VoteType.UPVOTE,
      submissionId: "sub-1",
      userId: "user-1",
      createdAt: new Date(),
    };

    const result = resolveVoteAction(existingVote, VoteType.DOWNVOTE);
    expect(result).toEqual({ action: "update", voteType: VoteType.DOWNVOTE });

    const existingVoteDown: Vote = {
      id: "vote-2",
      voteType: VoteType.DOWNVOTE,
      submissionId: "sub-1",
      userId: "user-1",
      createdAt: new Date(),
    };

    const resultDown = resolveVoteAction(existingVoteDown, VoteType.UPVOTE);
    expect(resultDown).toEqual({ action: "update", voteType: VoteType.UPVOTE });
  });
});
