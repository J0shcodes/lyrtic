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
    const eventType = searchParams.get("event_type") || "";

    // Verify customer belongs to org
    const customerCheck = await query(
      `SELECT id FROM customers WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, organization_id],
    );
    if (!customerCheck.rows[0]) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    let whereClause = `customer_id = $1`;
    const queryParams: (string | number)[] = [id];

    if (eventType) {
      queryParams.push(eventType);
      whereClause += ` AND event_type = $${queryParams.length}`;
    }

    const [eventsResult, countResult] = await Promise.all([
      query(
        `SELECT id, event_type, event_name, event_date, properties, created_at
         FROM events
         WHERE ${whereClause}
         ORDER BY event_date DESC
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset],
      ),
      query(
        `SELECT COUNT(*) AS total FROM events WHERE ${whereClause}`,
        queryParams,
      ),
    ]);

    const total = parseInt(countResult.rows[0]?.total || "0");

    return NextResponse.json({
      events: eventsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Customer events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { organization_id, full_name, email } = session;
    const body = await request.json();
    const { title, body: noteBody } = body;

    if (!title && !noteBody) {
      return NextResponse.json(
        { error: "Note must have a title or body" },
        { status: 400 },
      );
    }

    // Verify customer belongs to org
    const customerCheck = await query(
      `SELECT id FROM customers WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, organization_id],
    );
    if (!customerCheck.rows[0]) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const result = await query(
      `INSERT INTO events (organization_id, customer_id, event_type, event_name, event_date, properties)
       VALUES ($1, $2, 'note', $3, NOW(), $4)
       RETURNING *`,
      [
        organization_id,
        id,
        title || "Note",
        JSON.stringify({ body: noteBody || "", created_by: full_name || email }),
      ],
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Add note error:", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 },
    );
  }
}