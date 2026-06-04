import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import {
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "@/app/actions/notification-actions";

export type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  metadata: any;
};

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 1. Fetch initial notifications list and count on mount
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    async function loadInitialData() {
      try {
        // Fetch notifications list
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (isMounted && json.data) {
          setNotifications(json.data);
        }

        // Fetch unread count
        const count = await getUnreadNotificationCount();
        if (isMounted) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Failed to load initial notifications:", err);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // 2. Setup Pusher subscription to private-user-{userId}
  useEffect(() => {
    if (!userId) return;

    // Configure Pusher client
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "mock-key", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      authEndpoint: "/api/pusher/auth",
    });

    const channelName = `private-user-${userId}`;
    const channel = pusher.subscribe(channelName);

    // Listen for new notifications
    channel.bind("new-notification", (newNotif: any) => {
      // Map createdAt if it's a Date object
      const formattedNotif: Notification = {
        ...newNotif,
        createdAt: typeof newNotif.createdAt === "object" 
          ? newNotif.createdAt.toISOString() 
          : newNotif.createdAt,
      };

      setNotifications((prev) => [formattedNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userId]);

  // 3. Mark a specific notification as read (optimistic update)
  const markRead = async (id: string) => {
    // Save original state for rollback
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    // Optimistically update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await markNotificationRead(id);
      if (!res.success) {
        // Rollback state if server action failed
        setNotifications(originalNotifications);
        setUnreadCount(originalUnreadCount);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // Rollback
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
    }
  };

  // 4. Mark all notifications as read (optimistic update)
  const markAllRead = async () => {
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    // Optimistically update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await markAllNotificationsRead();
      if (res.updatedCount === 0 && originalUnreadCount > 0) {
        // Rollback if nothing got updated
        setNotifications(originalNotifications);
        setUnreadCount(originalUnreadCount);
      }
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      // Rollback
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
    }
  };

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
  };
}
