import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth-service";
import { cookies } from "next/headers";
import { use } from "react";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, organizationName } = body;

    if (!email || !password || !fullName || !organizationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const { user, organization, membership } = await authService.register(
      email,
      password,
      fullName,
      organizationName,
    );

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;

    const session = await authService.createSession(
      user.id,
      request.headers.get("user-agent") || undefined,
      ipAddress,
    );

    const cookieStore = await cookies();
    cookieStore.set("auth-token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    });
  } catch (error) {
    console.error("Sign up error:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "An error occurred during sign up" },
      { status: 500 },
    );
  }
}
