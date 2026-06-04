import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeLeaderboardScore,
  getContributionData,
  validateUploadedFile,
} from "@/lib/utils";
import { prisma } from "@/lib/prisma";

// Mock the prisma module
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      submission: {
        findMany: vi.fn(),
      },
      review: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("computeLeaderboardScore", () => {
  it("should return 0 for zero values", () => {
    const score = computeLeaderboardScore({
      reputation: 0,
      totalReviewsGiven: 0,
      totalSubmissions: 0,
      netVotesReceived: 0,
    });
    expect(score).toBe(0);
  });

  it("should return 205.00 for reputation: 100, totalReviewsGiven: 5, totalSubmissions: 3, netVotesReceived: 10", () => {
    const score = computeLeaderboardScore({
      reputation: 100,
      totalReviewsGiven: 5,
      totalSubmissions: 3,
      netVotesReceived: 10,
    });
    expect(score).toBe(205.00);
  });

  it("should return lower score for negative net votes compared to zero net votes", () => {
    const scoreWithZeroVotes = computeLeaderboardScore({
      reputation: 50,
      totalReviewsGiven: 2,
      totalSubmissions: 1,
      netVotesReceived: 0,
    });
    const scoreWithNegativeVotes = computeLeaderboardScore({
      reputation: 50,
      totalReviewsGiven: 2,
      totalSubmissions: 1,
      netVotesReceived: -5,
    });
    expect(scoreWithNegativeVotes).toBeLessThan(scoreWithZeroVotes);
  });

  it("should return a number rounded to 2 decimal places", () => {
    const score = computeLeaderboardScore({
      reputation: 10,
      totalReviewsGiven: 1,
      totalSubmissions: 1,
      netVotesReceived: 1,
    });
    expect(typeof score).toBe("number");
    // Ensure it is mathematically rounded to 2 decimal places
    expect(Number(score.toFixed(2))).toBe(score);
  });
});

describe("getContributionData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return exactly 30 items with YYYY-MM-DD date and non-negative count", async () => {
    // Mock prisma responses
    const mockSubmissions = [
      { createdAt: new Date() },
      { createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ];
    const mockReviews = [
      { createdAt: new Date() },
      { createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ];

    vi.mocked(prisma.submission.findMany).mockResolvedValue(mockSubmissions as any);
    vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);

    const data = await getContributionData("user-1");

    expect(data.length).toBe(30);

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    for (const item of data) {
      expect(item.date).toMatch(datePattern);
      expect(item.count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(item.count)).toBe(true);
    }

    // Verify today's date count has 2 activities (1 submission + 1 review)
    const todayStr = new Date().toISOString().split("T")[0];
    const todayItem = data.find((d) => d.date === todayStr);
    expect(todayItem).toBeDefined();
    expect(todayItem?.count).toBe(2);
  });
});

describe("validateUploadedFile", () => {
  it("should validate a PNG file under 5MB successfully", () => {
    const mockFile = {
      type: "image/png",
      size: 3 * 1024 * 1024, // 3MB
    } as File;

    const result = validateUploadedFile(mockFile);
    expect(result).toEqual({ valid: true, error: null });
  });

  it("should reject a PDF file", () => {
    const mockFile = {
      type: "application/pdf",
      size: 2 * 1024 * 1024,
    } as File;

    const result = validateUploadedFile(mockFile);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTypeOf("string");
    expect(result.error?.length).toBeGreaterThan(0);
  });

  it("should reject a PNG file over 5MB", () => {
    const mockFile = {
      type: "image/png",
      size: 6 * 1024 * 1024,
    } as File;

    const result = validateUploadedFile(mockFile);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTypeOf("string");
    expect(result.error?.length).toBeGreaterThan(0);
  });
});
