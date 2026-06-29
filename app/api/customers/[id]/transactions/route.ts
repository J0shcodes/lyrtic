import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { organization_id } = session;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const offset = (page - 1) * limit;

    // Verify customer belongs to org
    const customerCheck = await query(
      `SELECT id FROM customers WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, organization_id],
    );
    if (!customerCheck.rows[0]) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [transactionsResult, countResult] = await Promise.all([
      query(
        `SELECT id, transaction_id, amount, currency, status, description,
                category, payment_method, transaction_date, created_at
         FROM transactions
         WHERE customer_id = $1
         ORDER BY transaction_date DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset],
      ),
      query(
        `SELECT COUNT(*) AS total FROM transactions WHERE customer_id = $1`,
        [id],
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0");

    return NextResponse.json({
      transactions: transactionsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Customer transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}