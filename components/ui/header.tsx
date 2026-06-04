"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, LogOut, Award, Code, CheckSquare, Layers, User } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userId = session?.user?.id || "";
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Code Feed", href: "/feed", icon: Layers },
    { name: "Leaderboard", href: "/leaderboard", icon: Award },
    { name: "Submit Code", href: "/submit", icon: Code },
  ];

  if (!session) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/75 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/feed" className="flex items-center gap-2 font-bold text-xl tracking-tight text-glow">
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              DevPulse
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href as any}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Options */}
        <div className="flex items-center gap-4">
          {/* User Reputation Score Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Award className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Rep: {session.user.reputation}</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all duration-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-200/50 pb-3 dark:border-zinc-800/50">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-80 overflow-y-auto space-y-1 divide-y divide-zinc-100 dark:divide-zinc-900/50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`group flex items-start gap-3 py-3 px-2 rounded-xl transition-all duration-150 ${
                          !notif.isRead
                            ? "bg-indigo-50/30 dark:bg-indigo-950/10"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm ${!notif.isRead ? "font-medium" : "text-zinc-600 dark:text-zinc-400"}`}>
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={() => markRead(notif.id)}
                            className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Mark as read"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Link */}
          <Link
            href={`/profile/${session.user.username}` as any}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity"
          >
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.displayName}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div className="flex w-8 h-8 items-center justify-center rounded-full bg-indigo-500 text-white text-sm font-semibold">
                {session.user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {session.user.displayName}
            </span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all duration-200"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
