import Link from "next/link";
import { HelpCircle, ArrowRight, Layers } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | DevPulse",
  description: "The page you are looking for does not exist on DevPulse.",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 glass-card rounded-3xl shadow-2xl relative overflow-hidden border border-white/20 dark:border-zinc-800/40 text-center space-y-6 bg-white/50 dark:bg-zinc-950/50">
        {/* Decorative gradient spheres */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl" />

        <div className="relative space-y-6">
          {/* Question Icon */}
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shadow-inner animate-pulse">
            <HelpCircle className="w-12 h-12" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              404
            </h2>
            <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              Page Not Found
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              The page you're searching for either doesn't exist, was moved, or you don't have access.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 justify-center items-center">
            <Link
              href="/feed"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl gradient-bg hover:opacity-90 active:scale-[0.98] transition-all text-white font-semibold shadow-lg shadow-indigo-500/20 text-sm"
            >
              <Layers className="w-4 h-4" />
              Return to Code Feed
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
