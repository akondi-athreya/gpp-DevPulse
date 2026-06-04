import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { User } from "@/app/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      reputation: number;
    } & import("next-auth").DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await validateCredentials(
          credentials.email as string,
          credentials.password as string
        );
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          reputation: user.reputation,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        const githubProfile = profile as any;
        const githubIdStr = githubProfile?.id ? String(githubProfile.id) : null;
        const email = user.email || githubProfile?.email;
        
        if (!email) {
          return false;
        }

        let dbUser = null;
        if (githubIdStr) {
          dbUser = await prisma.user.findUnique({
            where: { githubId: githubIdStr }
          });
        }

        if (!dbUser && email) {
          dbUser = await prisma.user.findUnique({
            where: { email }
          });
        }

        if (!dbUser) {
          let username = githubProfile?.login || email.split("@")[0] || "user";
          let isUnique = false;
          let counter = 0;
          let candidateUsername = username;
          while (!isUnique) {
            const existing = await prisma.user.findUnique({
              where: { username: candidateUsername }
            });
            if (!existing) {
              isUnique = true;
            } else {
              counter++;
              candidateUsername = `${username}${counter}`;
            }
          }
          username = candidateUsername;

          await prisma.user.create({
            data: {
              email,
              username,
              displayName: githubProfile?.name || githubProfile?.login || username,
              avatarUrl: githubProfile?.avatar_url || null,
              githubId: githubIdStr,
              reputation: 0,
            }
          });
        } else {
          if (githubIdStr && !dbUser.githubId) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { githubId: githubIdStr }
            });
          }
        }
      }
      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.displayName = dbUser.displayName;
          token.reputation = dbUser.reputation;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.displayName = token.displayName as string;
        session.user.reputation = token.reputation as number;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  }
});

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  if (!email || !password) return null;
  
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user || !user.password) return null;
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  
  return user;
}

export async function getServerSession() {
  const session = await auth();
  if (!session || !session.user) return null;
  
  return {
    ...session,
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
    displayName: session.user.displayName,
    reputation: session.user.reputation,
    user: {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      displayName: session.user.displayName,
      reputation: session.user.reputation,
    }
  };
}

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  reputation: number;
};

export async function getUserFromSession(req?: NextRequest): Promise<SessionUser | null> {
  if (req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET });
    if (!token) return null;
    return {
      id: token.id as string,
      email: token.email as string,
      username: token.username as string,
      displayName: token.displayName as string,
      reputation: Number(token.reputation),
    };
  } else {
    const session = await auth();
    if (!session || !session.user) return null;
    return {
      id: session.user.id as string,
      email: session.user.email as string,
      username: session.user.username as string,
      displayName: session.user.displayName as string,
      reputation: Number(session.user.reputation),
    };
  }
}
