import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getUserFromSession } from "@/lib/auth";
import { SubmissionStatus, DifficultyTag, VoteType } from "@/app/generated/prisma/client";
import { z } from "zod";
import crypto from "crypto";

import { createSubmissionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;

    // 1. Authenticate user to populate userVote later
    const sessionUser = await getUserFromSession(req);
    const authenticatedUserId = sessionUser?.id || null;
    // 2. Build Cache Key
    // Sort query params and hash them
    const sortedParams: Array<[string, string]> = [];
    searchParams.forEach((value, key) => {
        sortedParams.push([key, value]);
    });
    sortedParams.sort((a, b) => a[0].localeCompare(b[0]));

    const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(sortedParams))
        .digest("hex");
    const cacheKey = `cache:submissions:${hash}`;

    // 3. Try to fetch from Redis cache
    try {
        const cached = await redis.get<string>(cacheKey);
        if (cached) {
            const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;

            // Dynamically populate userVote on cache hit if user is authenticated
            if (authenticatedUserId && parsed.data && parsed.data.submissions) {
                const submissionIds = parsed.data.submissions.map((s: { id: string }) => s.id);
                const userVotes = await prisma.vote.findMany({
                    where: {
                        userId: authenticatedUserId,
                        submissionId: { in: submissionIds },
                    },
                });
                const voteMap = new Map(userVotes.map((v) => [v.submissionId, v.voteType]));
                parsed.data.submissions = parsed.data.submissions.map((s: { id: string }) => ({
                    ...s,
                    userVote: voteMap.get(s.id) || null,
                }));
            }
            return NextResponse.json(parsed);
        }
    } catch (error) {
        console.error("Cache read failed:", error);
    }

    // 4. Parse query parameters
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const statusParam = searchParams.get("status");
    const languageParam = searchParams.get("language");
    const difficultyParam = searchParams.get("difficulty");
    const sortParam = searchParams.get("sort") || "newest";
    const tagParam = searchParams.get("tag");

    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(limitParam || "10", 10) || 10));

    // Build where clause
    const where: any = {};

    if (statusParam && Object.values(SubmissionStatus).includes(statusParam as SubmissionStatus)) {
        where.status = statusParam as SubmissionStatus;
    }
    if (languageParam) {
        where.language = {
            equals: languageParam,
            mode: "insensitive",
        };
    }
    if (difficultyParam && Object.values(DifficultyTag).includes(difficultyParam as DifficultyTag)) {
        where.difficultyTag = difficultyParam as DifficultyTag;
    }
    if (tagParam) {
        where.tags = {
            some: {
                tag: {
                    name: {
                        equals: tagParam,
                        mode: "insensitive",
                    },
                },
            },
        };
    }

    // Build sorting orderBy
    let orderBy: any = { createdAt: "desc" };
    if (sortParam === "oldest") {
        orderBy = { createdAt: "asc" };
    } else if (sortParam === "most_voted") {
        orderBy = { votes: { _count: "desc" } };
    } else if (sortParam === "most_reviewed") {
        orderBy = { reviews: { _count: "desc" } };
    }

    // Configure includes for user votes and other counts
    const includeOptions: any = {
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
    };

    if (authenticatedUserId) {
        includeOptions.votes = {
            where: {
                userId: authenticatedUserId,
            },
        };
    }

    // 5. Query PostgreSQL database
    try {
        const total = await prisma.submission.count({ where });
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;

        const rawSubmissions: any[] = await prisma.submission.findMany({
            where,
            include: includeOptions,
            orderBy,
            skip,
            take: limit,
        });

        // Map output fields exactly as required by the spec
        const submissions = rawSubmissions.map((sub) => {
            const userVote =
                authenticatedUserId && sub.votes && sub.votes.length > 0
                    ? (sub.votes[0].voteType as VoteType)
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

        const responseBody = {
            data: {
                submissions,
            },
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };

        // Cache the response in Redis for 60 seconds (user-agnostic cache)
        try {
            const cacheSubmissions = submissions.map((s) => ({
                ...s,
                userVote: null,
            }));
            const cacheBody = {
                data: {
                    submissions: cacheSubmissions,
                },
                meta: responseBody.meta,
            };
            await redis.set(cacheKey, JSON.stringify(cacheBody), { ex: 60 });
        } catch (cacheError) {
            console.error("Cache write failed:", cacheError);
        }

        return NextResponse.json(responseBody);
    } catch (dbError) {
        console.error("Database query failed:", dbError);
        return NextResponse.json({ error: "Internal Server Error", code: "internal_server_error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // 1. Authenticate user
    const sessionUser = await getUserFromSession(req);
    if (!sessionUser) {
        return NextResponse.json({ error: "Authentication required", code: "unauthenticated" }, { status: 401 });
    }

    // 2. Parse and validate body
    try {
        const body = await req.json();
        const parsed = createSubmissionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", code: "validation_failed", details: parsed.error.flatten() }, { status: 400 });
        }

        const { title, description, codeContent, language, difficultyTag, tagIds } = parsed.data;

        // 3. Create Submission and Increment reputation in a transaction
        const newSubmission = await prisma.$transaction(async (tx) => {
            // Increment the author's reputation by 5 points
            await tx.user.update({
                where: { id: sessionUser.id },
                data: { reputation: { increment: 5 } },
            });

            // Create the submission record and associate tags
            return tx.submission.create({
                data: {
                    title,
                    description,
                    codeContent,
                    language,
                    difficultyTag,
                    authorId: sessionUser.id,
                    tags: {
                        create: tagIds.map((tagId) => ({
                            tagId,
                        })),
                    },
                },
                include: {
                    author: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
        });

        // 5. Invalidate cache: Delete all keys matching cache:submissions:*
        try {
            const keys = await redis.keys("cache:submissions:*");
            if (keys && keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (cacheError) {
            console.error("Failed to invalidate cache:", cacheError);
        }

        const responseData = {
            id: newSubmission.id,
            title: newSubmission.title,
            description: newSubmission.description,
            codeContent: newSubmission.codeContent,
            language: newSubmission.language,
            status: newSubmission.status,
            difficultyTag: newSubmission.difficultyTag,
            viewCount: newSubmission.viewCount,
            createdAt: newSubmission.createdAt.toISOString(),
            updatedAt: newSubmission.updatedAt.toISOString(),
            author: {
                id: newSubmission.author.id,
                username: newSubmission.author.username,
                displayName: newSubmission.author.displayName,
                avatarUrl: newSubmission.author.avatarUrl,
                reputation: newSubmission.author.reputation,
            },
            tags: newSubmission.tags.map((st: any) => ({
                id: st.tag.id,
                name: st.tag.name,
                color: st.tag.color,
            })),
            userVote: null,
        };

        return NextResponse.json({ data: responseData }, { status: 201 });
    } catch (error) {
        console.error("Submission creation failed:", error);
        return NextResponse.json({ error: "Internal Server Error", code: "internal_server_error" }, { status: 500 });
    }
}