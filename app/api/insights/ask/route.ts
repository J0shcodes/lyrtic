import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getOrgContext(organizationId: string): Promise<string> {
  const [metrics, riskCustomers, recentActivity] = await Promise.all([
    query(
      `SELECT
         COUNT(*) FILTER (WHERE deleted_at IS NULL)                             AS total_customers,
         COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL)       AS active_customers,
         COUNT(*) FILTER (WHERE status = 'churned' AND deleted_at IS NULL)      AS churned_customers,
         ROUND(AVG(health_score) FILTER (WHERE deleted_at IS NULL)::numeric,1)  AS avg_health_score,
         COUNT(*) FILTER (WHERE churn_risk = 'critical' AND deleted_at IS NULL) AS critical_count,
         COUNT(*) FILTER (WHERE churn_risk = 'high' AND deleted_at IS NULL)     AS high_count,
         COUNT(*) FILTER (WHERE churn_risk = 'low' AND deleted_at IS NULL)      AS low_count
       FROM customers WHERE organization_id = $1`,
      [organizationId],
    ),
    query(
      `SELECT c.full_name, c.email, c.health_score, c.churn_risk,
              COALESCE(SUM(t.amount) FILTER (WHERE t.status='completed'),0) AS ltv
       FROM customers c
       LEFT JOIN transactions t ON t.customer_id = c.id
       WHERE c.organization_id = $1 AND c.churn_risk IN ('high','critical') AND c.deleted_at IS NULL
       GROUP BY c.id ORDER BY c.health_score ASC LIMIT 5`,
      [organizationId],
    ),
    query(
      `SELECT COALESCE(SUM(amount),0) AS total_revenue,
              COUNT(*) AS total_transactions
       FROM transactions t
       JOIN customers c ON c.id = t.customer_id
       WHERE c.organization_id = $1 AND t.status = 'completed'`,
      [organizationId],
    ),
  ]);

  const m = metrics.rows[0];
  const atRisk = riskCustomers.rows
    .map(
      (r) =>
        `  - ${r.full_name || r.email}: health=${r.health_score}, risk=${r.churn_risk}, LTV=$${Number(r.ltv).toFixed(0)}`,
    )
    .join("\n");

  return `
ORGANIZATION DATA SNAPSHOT:
- Total customers: ${m.total_customers}
- Active: ${m.active_customers} | Churned: ${m.churned_customers}
- Avg health score: ${m.avg_health_score}
- Churn risk breakdown: critical=${m.critical_count}, high=${m.high_count}, low=${m.low_count}
- Total revenue: $${Number(recentActivity.rows[0]?.total_revenue || 0).toFixed(0)}
- Total transactions: ${recentActivity.rows[0]?.total_transactions || 0}
 
TOP AT-RISK CUSTOMERS (by lowest health score):
${atRisk || "  None currently at risk"}
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id } = session;
    const body = await request.json();
    const { query: userQuery } = body;

    if (!userQuery?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        answer: `Demo mode: your query was "${userQuery}". Connect an Anthropic API key to get real AI-powered insights about your customer base.`,
      });
    }

    const orgContext = await getOrgContext(organization_id);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: `You are a customer intelligence analyst for a B2B SaaS platform called Lyrtic.
You have access to real data about this organization's customers and must answer the user's question accurately and concisely.
Base your answer strictly on the data provided. If the data doesn't support a conclusion, say so.
Keep responses focused, actionable, and under 200 words.`,
      messages: [
        {
          role: "user",
          content: `${orgContext}\n\nQuestion: ${userQuery}`,
        },
      ],
    });

    const answer =
      message.content[0].type === "text"
        ? message.content[0].text
        : "Unable to generate insight at this time";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 },
    );
  }
}
