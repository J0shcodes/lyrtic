import { NextRequest, NextResponse } from "next/server";
import { authService } from "./auth-service";

export async function withAuth(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const userWithOrg = await authService.getUserOrganization(token);
    return userWithOrg;
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await withAuth(request);

  if (!user) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const response = NextResponse.redirect(new URL("/sign-in", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  return user;
}

export function createAuthHeader(token: string) {
  return {
    "Authorization": `Bearer ${token}`,
  };
}
