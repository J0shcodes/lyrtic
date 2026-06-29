import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";
import { getCustomerHealthBreakdown } from "@/services/health-score-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { organization_id } = session;

    const customerResult = await query(
      `SELECT c.*,
              COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'completed'), 0) AS total_revenue,
              COUNT(DISTINCT t.id) AS transaction_count,
              MIN(t.transaction_date) AS first_transaction_at,
              MAX(t.transaction_date) AS last_transaction_at
       FROM customers c
       LEFT JOIN transactions t ON t.customer_id = c.id
       WHERE c.id = $1 AND c.organization_id = $2 AND c.deleted_at IS NULL
       GROUP BY c.id`,
      [id, organization_id],
    );

    if (!customerResult.rows[0]) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Recent transactions (last 5)
    const transactionsResult = await query(
      `SELECT id, amount, currency, status, description, category, transaction_date
       FROM transactions
       WHERE customer_id = $1
       ORDER BY transaction_date DESC
       LIMIT 5`,
      [id],
    );

    // Recent events/timeline (last 10)
    const eventsResult = await query(
      `SELECT id, event_type, event_name, event_date, properties
       FROM events
       WHERE customer_id = $1
       ORDER BY event_date DESC
       LIMIT 10`,
      [id],
    );

    // Health score breakdown
    const healthBreakdown = await getCustomerHealthBreakdown(id, organization_id);

    return NextResponse.json({
      customer: customerResult.rows[0],
      recent_transactions: transactionsResult.rows,
      recent_events: eventsResult.rows,
      health_breakdown: healthBreakdown?.breakdown ?? null,
    });
  } catch (error) {
    console.error("Customer detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { organization_id } = session;
    const body = await request.json();

    const allowedFields = [
      "full_name",
      "phone",
      "location",
      "status",
      "lifecycle_stage",
      "health_score",
      "churn_risk",
      "notes",
    ];

    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (field in body) {
        values.push(body[field]);
        updates.push(`${field} = $${values.length}`);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id, organization_id);
    const result = await query(
      `UPDATE customers SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${values.length - 1} AND organization_id = $${values.length} AND deleted_at IS NULL
       RETURNING *`,
      values,
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Update customer error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { organization_id } = session;

    await query(
      `UPDATE customers SET deleted_at = NOW() WHERE id = $1 AND organization_id = $2`,
      [id, organization_id],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 },
    );
  }
}