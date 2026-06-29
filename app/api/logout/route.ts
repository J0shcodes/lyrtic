import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (token) {
      // Invalidate session in database
      // await authService.invalidateSession(token)
    }

    cookieStore.delete("auth-token");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to logout user");
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
