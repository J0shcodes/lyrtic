import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { recalculateOrgHealthScores } from "@/services/health-score-service";

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id } = session;
    const { updated } = await recalculateOrgHealthScores(organization_id);

    return NextResponse.json({
      success: true,
      updated,
      message: `Health scores recalculated for ${updated} customers`,
    });
  } catch (error) {
    console.error("Health score recalculation error:", error);
    return NextResponse.json(
      { error: "Failed to recalculate health scores" },
      { status: 500 },
    );
  }
}
