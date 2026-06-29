import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = user.id;

    // Get metrics from database
    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_customers,
        COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) as active_customers,
        COUNT(*) FILTER (WHERE status = 'churned' AND deleted_at IS NULL) as churned_customers,
        ROUND(AVG(health_score)::numeric, 1) as average_health_score,
        COUNT(*) FILTER (WHERE churn_risk = 'critical' AND deleted_at IS NULL) as critical_risk_count
      FROM customers
      WHERE organization_id = $1`,
      [organizationId],
    );

    const row = result.rows[0];

    // Calculate total revenue from transactions
    const revenueResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue
       FROM transactions t
       JOIN customers c ON t.customer_id = c.id
       WHERE c.organization_id = $1 AND c.status = 'active'`,
      [organizationId],
    );

    return NextResponse.json({
      totalCustomers: parseInt(row.total_customers) || 0,
      activeCustomers: parseInt(row.active_customers) || 0,
      churnedCustomers: parseInt(row.churned_customers) || 0,
      averageHealthScore: parseFloat(row.average_health_score) || 0,
      criticalRiskCount: parseInt(row.critical_risk_count) || 0,
      totalRevenue: parseFloat(revenueResult.rows[0]?.total_revenue) || 0,
    });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
