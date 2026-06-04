"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(data: any) {
  const { email, username, displayName, password } = data;

  if (!email || !username || !displayName || !password) {
    return { error: "All fields are required" };
  }

  try {
    // 1. Verify email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return { error: "Email is already registered" };
    }

    // 2. Verify username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return { error: "Username is already taken" };
    }

    // 3. Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the new user record
    await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        password: hashedPassword,
        reputation: 0,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration failed:", error);
    return { error: "Internal Server Error during registration" };
  }
}
