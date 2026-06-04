import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { getUserFromSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // 1. Authenticate user
  const sessionUser = await getUserFromSession(req);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let socketId = "";
  let channelName = "";

  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      socketId = (formData.get("socket_id") as string) || "";
      channelName = (formData.get("channel_name") as string) || "";
    } else {
      const body = await req.json();
      socketId = body.socket_id || "";
      channelName = body.channel_name || "";
    }
  } catch (e) {
    console.error("Failed to parse Pusher auth request:", e);
  }

  if (!socketId || !channelName) {
    return new Response("Bad Request: Missing socket_id or channel_name", { status: 400 });
  }

  // 2. Enforce security: users can only subscribe to their own private-user-{userId} channel
  if (channelName.startsWith("private-user-")) {
    const targetUserId = channelName.replace("private-user-", "");
    if (targetUserId !== sessionUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 3. Generate Pusher authorization payload
  try {
    const authPayload = (pusherServer as any).authorizeChannel
      ? (pusherServer as any).authorizeChannel(socketId, channelName)
      : (pusherServer as any).authenticate(socketId, channelName);
    return NextResponse.json(authPayload);
  } catch (err) {
    console.error("Pusher auth signature generation failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
