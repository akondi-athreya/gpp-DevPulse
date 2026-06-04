"use server";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getServerSession } from "@/lib/auth";

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
  const session = await getServerSession();
  if (!session || !session.user) {
    return { success: false };
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { success: false };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    // Invalidate Redis unread count cache
    const cacheKey = `notif:unread:${session.user.id}`;
    try {
      await redis.del(cacheKey);
    } catch (e) {
      console.error(e);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false };
  }
}

export async function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  const session = await getServerSession();
  if (!session || !session.user) {
    return { updatedCount: 0 };
  }

  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Invalidate Redis unread count cache
    const cacheKey = `notif:unread:${session.user.id}`;
    try {
      await redis.del(cacheKey);
    } catch (e) {
      console.error(e);
    }

    return { updatedCount: result.count };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return { updatedCount: 0 };
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await getServerSession();
  if (!session || !session.user) {
    return 0;
  }

  const cacheKey = `notif:unread:${session.user.id}`;

  try {
    const cached = await redis.get<number>(cacheKey);
    if (cached !== null) {
      return Number(cached);
    }
  } catch (cacheError) {
    console.error("Failed to read notification count cache:", cacheError);
  }

  try {
    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    try {
      await redis.set(cacheKey, count, { ex: 30 });
    } catch (cacheError) {
      console.error("Failed to write notification count cache:", cacheError);
    }

    return count;
  } catch (error) {
    console.error("Failed to get unread notification count:", error);
    return 0;
  }
}
