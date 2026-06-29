import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";
import { recalculateOrgHealthScores } from "@/services/health-score-service";

const STANDARD_FIELDS = [
  "email",
  "full_name",
  "phone",
  "location",
  "customer_id",
  "status",
  "lifecycle_stage",
  "notes",
];

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id } = session;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10 MB limit" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have at least a header row and one data row" },
        { status: 400 },
      );
    }

    if (lines.length > 50001) {
      return NextResponse.json(
        { error: "Maximum 50,000 rows per import" },
        { status: 400 },
      );
    }

    const headers = parseCsvLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    );

    const emailIndex = headers.indexOf("email");
    const nameIndex = headers.indexOf("full_name");

    if (emailIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must include an "email" column' },
        { status: 400 },
      );
    }
    if (nameIndex === -1) {
      return NextResponse.json(
        { error: 'CSV must include a "full_name" column' },
        { status: 400 },
      );
    }

    // Build column map for optional fields
    const fieldMap: Record<string, number> = {
      email: emailIndex,
      full_name: nameIndex,
    };
    for (const field of STANDARD_FIELDS) {
      const idx = headers.indexOf(field);
      if (idx !== -1) fieldMap[field] = idx;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);

      try {
        const email = values[emailIndex]?.trim();
        const fullName = values[nameIndex]?.trim();

        if (!email) {
          errors.push({ row: i + 1, error: "Missing email" });
          errorCount++;
          continue;
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push({ row: i + 1, error: `Invalid email: ${email}` });
          errorCount++;
          continue;
        }

        const phone =
          fieldMap.phone !== undefined
            ? values[fieldMap.phone]?.trim() || null
            : null;
        const location =
          fieldMap.location !== undefined
            ? values[fieldMap.location]?.trim() || null
            : null;
        const customerId =
          fieldMap.customer_id !== undefined
            ? values[fieldMap.customer_id]?.trim() || null
            : null;
        const status =
          fieldMap.status !== undefined
            ? values[fieldMap.status]?.trim() || "active"
            : "active";
        const lifecycleStage =
          fieldMap.lifecycle_stage !== undefined
            ? values[fieldMap.lifecycle_stage]?.trim() || "customer"
            : "customer";
        const notes =
          fieldMap.notes !== undefined
            ? values[fieldMap.notes]?.trim() || null
            : null;

        await query(
          `INSERT INTO customers
             (organization_id, email, full_name, phone, location, customer_id,
              status, lifecycle_stage, notes, health_score, churn_risk)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 50, 'low')
           ON CONFLICT (organization_id, email) DO UPDATE SET
             full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
             phone = COALESCE(EXCLUDED.phone, customers.phone),
             location = COALESCE(EXCLUDED.location, customers.location),
             status = COALESCE(EXCLUDED.status, customers.status),
             lifecycle_stage = COALESCE(EXCLUDED.lifecycle_stage, customers.lifecycle_stage),
             updated_at = NOW()`,
          [
            organization_id,
            email,
            fullName || null,
            phone,
            location,
            customerId,
            status,
            lifecycleStage,
            notes,
          ],
        );

        successCount++;
      } catch (rowError) {
        errorCount++;
        errors.push({ row: i + 1, error: String(rowError) });
        console.error(`Import row ${i + 1} error:`, rowError);
      }
    }

    // Trigger health score recalculation asynchronously (non-blocking for response)
    recalculateOrgHealthScores(organization_id).catch((err) =>
      console.error("Health score recalculation failed:", err),
    );

    return NextResponse.json({
      success: true,
      imported: successCount,
      updated: successCount, // ON CONFLICT updates are counted in imported
      errors: errorCount,
      total: successCount + errorCount,
      error_sample: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to process import file" },
      { status: 500 },
    );
  }
}
