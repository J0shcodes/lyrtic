import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = user.id;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n");

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have at least a header row and one data row" },
        { status: 400 },
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const emailIndex = headers.indexOf("email");
    const nameIndex = headers.indexOf("full_name");

    if (emailIndex === -1 || nameIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must have "email" and "full_name" columns' },
        { status: 400 },
      );
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim());

      try {
        const email = values[emailIndex];
        const fullName = values[nameIndex];

        if (!email || !fullName) continue;

        await query(
          `INSERT INTO customers (organization_id, email, full_name, status, lifecycle_stage, health_score, churn_risk)
           VALUES ($1, $2, $3, 'active', 'customer', 50, 'low')
           ON CONFLICT (organization_id, email) DO NOTHING`,
          [organizationId, email, fullName],
        );

        successCount++;
      } catch (error) {
        errorCount++;
        console.error("Error importing row:", error);
      }
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      errors: errorCount,
      total: successCount + errorCount,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import file" },
      { status: 500 },
    );
  }
}
