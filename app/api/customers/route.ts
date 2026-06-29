import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = user.id;

    const result = await query(
      `SELECT id, full_name, email, health_score, churn_risk, status
       FROM customers
       WHERE organization_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 100`,
      [organizationId],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}
