import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // 1. Authenticate user
  const sessionUser = await getUserFromSession(req);
  if (!sessionUser) {
    return NextResponse.json(
      { error: "Authentication required", code: "unauthenticated" },
      { status: 401 }
    );
  }

  try {
    // 2. Fetch all notifications for the authenticated user
    const notifications = await prisma.notification.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error", code: "internal_server_error" },
      { status: 500 }
    );
  }
}
