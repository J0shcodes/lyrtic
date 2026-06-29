import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await withAuth(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {organization_id} = session;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") === "asc" ? "ASC" : "DESC";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    const allowedSorts: Record<string, string> = {
      created_at: "c.created_at",
      health_score: "c.health_score",
      full_name: "c.full_name",
      churn_risk: "c.churn_risk",
    };
    const orderBy = allowedSorts[sort] ?? "c.created_at";

    let whereClause = `c.organization_id = $1 AND c.deleted_at IS NULL`;
    const params: (string | number)[] = [organization_id];
 
    if (search) {
        params.push(`%${search}%`)
        whereClause += ` AND (c.full_name ILIKE $${params.length} OR c.email ILIKE $${params.length})`
    }

    if (status) {
      params.push(status);
      whereClause += ` AND c.status = $${params.length}`;
    }

    const result = await query(
      `SELECT c.id, c.full_name, c.email, c.phone, c.location,
              c.status, c.lifecycle_stage, c.health_score, c.churn_risk,
              c.last_interaction, c.created_at,
              COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'completed'), 0) AS total_revenue,
              COUNT(t.id) AS transaction_count
       FROM customers c
       LEFT JOIN transactions t ON t.customer_id = c.id
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY ${orderBy} ${order}
       LIMIT ${limit}`,
      params,
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Customers list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const { organization_id } = session;
    const body = await request.json();
    const { email, full_name, phone, location, status, lifecycle_stage, notes } = body;
 
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
 
    const result = await query(
      `INSERT INTO customers (organization_id, email, full_name, phone, location, status, lifecycle_stage, notes, health_score, churn_risk)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 50, 'low')
       RETURNING *`,
      [
        organization_id,
        email,
        full_name || null,
        phone || null,
        location || null,
        status || "active",
        lifecycle_stage || "customer",
        notes || null,
      ],
    );
 
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "A customer with this email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 },
    );
  }
}
 
