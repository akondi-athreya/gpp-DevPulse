import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth";
import { validateUploadedFile } from "@/lib/utils";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const sessionUser = await getUserFromSession(req);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "Authentication required", code: "unauthenticated" },
      { status: 401 }
    );
  }

  try {
    // 2. Parse Multipart form data
    const formData = await req.formData();
    const file = formData.get("snapshot") as File | null;
    const submissionId = formData.get("submissionId") as string | null;

    if (!file || !submissionId) {
      return NextResponse.json(
        { error: "Missing snapshot file or submissionId", code: "validation_failed" },
        { status: 400 }
      );
    }

    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found", code: "not_found" },
        { status: 404 }
      );
    }

    // 3. Validate uploaded file using helper
    const validation = validateUploadedFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "File validation failed", code: "validation_failed" },
        { status: 400 }
      );
    }

    // 4. Upload to Vercel Blob or fallback to a Mock URL if token is missing
    let imageUrl = "";
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`snapshots/${submissionId}-${file.name}`, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      imageUrl = blob.url;
    } else {
      // Mock fallback image for local development
      imageUrl = `https://placehold.co/800x600/0f172a/f8fafc?text=Code+Snapshot+for+${submission.title}`;
      console.log(`[MockUpload] Mocked upload of "${file.name}" to URL: ${imageUrl}`);
    }

    // 5. Create CodeSnapshot record in the database
    const snapshot = await prisma.codeSnapshot.create({
      data: {
        submissionId,
        imageUrl,
      },
    });

    return NextResponse.json(
      {
        data: {
          snapshotId: snapshot.id,
          imageUrl: snapshot.imageUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("File upload failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}
