import { z } from "zod";
import { DifficultyTag } from "@/app/generated/prisma/client";
import { SUPPORTED_LANGUAGES } from "./constants";

export const createSubmissionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title must be at most 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description must be at most 2000 characters"),
  codeContent: z.string().min(10, "Code content must be at least 10 characters").max(50000, "Code content must be at most 50000 characters"),
  language: z.string().refine((lang) => (SUPPORTED_LANGUAGES as readonly string[]).includes(lang), {
    message: "Unsupported language",
  }),
  difficultyTag: z.nativeEnum(DifficultyTag),
  tagIds: z.array(z.string()).min(1, "At least 1 tag is required").max(5, "At most 5 tags are allowed"),
});

export const createReviewSchema = z.object({
  submissionId: z.string().cuid("Invalid submission ID"),
  content: z.string().min(30, "Content must be at least 30 characters").max(5000, "Content must be at most 5000 characters"),
  lineReference: z.number().int().positive("Line reference must be a positive integer").optional().nullable(),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
});
