import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const session = await withAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id } = session;

    const [customerMetrics, revenueResult, riskDistribution, healthBuckets] =
      await Promise.all([
        query(
          `SELECT
             COUNT(*) FILTER (WHERE deleted_at IS NULL)                              AS total_customers,
             COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL)        AS active_customers,
             COUNT(*) FILTER (WHERE status = 'churned' AND deleted_at IS NULL)       AS churned_customers,
             ROUND(AVG(health_score) FILTER (WHERE deleted_at IS NULL)::numeric, 1)  AS average_health_score,
             COUNT(*) FILTER (WHERE churn_risk = 'critical' AND deleted_at IS NULL)  AS critical_risk_count,
             COUNT(*) FILTER (WHERE churn_risk = 'high' AND deleted_at IS NULL)      AS high_risk_count,
             COUNT(*) FILTER (WHERE churn_risk = 'medium' AND deleted_at IS NULL)    AS medium_risk_count,
             COUNT(*) FILTER (WHERE churn_risk = 'low' AND deleted_at IS NULL)       AS low_risk_count,
             COUNT(*) FILTER (
               WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL
             )                                                                        AS new_this_week
           FROM customers
           WHERE organization_id = $1`,
          [organization_id],
        ),

        query(
          `SELECT COALESCE(SUM(t.amount), 0) AS total_revenue
           FROM transactions t
           JOIN customers c ON t.customer_id = c.id
           WHERE c.organization_id = $1 AND t.status = 'completed' AND c.deleted_at IS NULL`,
          [organization_id],
        ),

        // Top 5 at-risk customers by total revenue
        query(
          `SELECT c.id, c.full_name, c.email, c.health_score, c.churn_risk,
                  COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'completed'), 0) AS total_revenue
           FROM customers c
           LEFT JOIN transactions t ON t.customer_id = c.id
           WHERE c.organization_id = $1
             AND c.churn_risk IN ('high', 'critical')
             AND c.deleted_at IS NULL
           GROUP BY c.id
           ORDER BY total_revenue DESC, c.health_score ASC
           LIMIT 5`,
          [organization_id],
        ),

        // Health score distribution for histogram
        query(
          `SELECT
             COUNT(*) FILTER (WHERE health_score >= 70) AS healthy,
             COUNT(*) FILTER (WHERE health_score >= 50 AND health_score < 70) AS at_risk,
             COUNT(*) FILTER (WHERE health_score >= 30 AND health_score < 50) AS high_risk,
             COUNT(*) FILTER (WHERE health_score < 30) AS critical
           FROM customers
           WHERE organization_id = $1 AND deleted_at IS NULL`,
          [organization_id],
        ),
      ]);

    const row = customerMetrics.rows[0];
    const hb = healthBuckets.rows[0];

    return NextResponse.json({
      totalCustomers: parseInt(row.total_customers) || 0,
      activeCustomers: parseInt(row.active_customers) || 0,
      churnedCustomers: parseInt(row.churned_customers) || 0,
      averageHealthScore: parseFloat(row.average_health_score) || 0,
      criticalRiskCount: parseInt(row.critical_risk_count) || 0,
      highRiskCount: parseInt(row.high_risk_count) || 0,
      mediumRiskCount: parseInt(row.medium_risk_count) || 0,
      lowRiskCount: parseInt(row.low_risk_count) || 0,
      newThisWeek: parseInt(row.new_this_week) || 0,
      totalRevenue: parseFloat(revenueResult.rows[0]?.total_revenue) || 0,
      topAtRisk: riskDistribution.rows,
      healthDistribution: {
        healthy: parseInt(hb?.healthy) || 0,
        at_risk: parseInt(hb?.at_risk) || 0,
        high_risk: parseInt(hb?.high_risk) || 0,
        critical: parseInt(hb?.critical) || 0,
      },
    });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
