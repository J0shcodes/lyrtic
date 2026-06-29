import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth-service";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (token) {
      await authService.invalidateSession(token)
    }

    cookieStore.delete("auth-token");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");
    return NextResponse.json({ success: true }, { status: 200 }); { status: 500 });
  }
}
