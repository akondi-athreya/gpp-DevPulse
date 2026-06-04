import { prisma } from "@/lib/prisma";
import SubmitForm from "@/components/forms/submit-form";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "DevPulse - Submit Code Review",
  description: "Request a code review on a code snippet or architecture issue.",
};

export default async function SubmitPage() {
  // 1. Authenticate user on Server
  const sessionUser = await getServerSession();
  if (!sessionUser) {
    redirect("/login");
  }

  // 2. Fetch available tags, seeding defaults if the table is empty
  let tags = await prisma.tag.findMany({
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  if (tags.length === 0) {
    const defaultTags = [
      { name: "React", color: "#61dafb" },
      { name: "Next.js", color: "#6366f1" },
      { name: "TypeScript", color: "#3178c6" },
      { name: "Node.js", color: "#10b981" },
      { name: "Python", color: "#f59e0b" },
      { name: "PostgreSQL", color: "#3b82f6" },
      { name: "Redis", color: "#ef4444" },
      { name: "Docker", color: "#06b6d4" },
      { name: "CSS/Tailwind", color: "#ec4899" },
      { name: "Performance", color: "#8b5cf6" },
    ];

    await prisma.tag.createMany({
      data: defaultTags,
    });

    tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
      },
    });
  }

  return <SubmitForm availableTags={tags} />;
}
