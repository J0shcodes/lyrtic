import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { query } from "@/lib/db";
import { recalculateOrgHealthScores } from "@/services/health-score-service";

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

const VALID_STATUSES = ["completed", "pending", "failed", "refunded"];

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organization_id } = session;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    console.log(file)

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
        { error: "CSV must have at least a header roe and one data row" },
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

    const emailIdx = headers.indexOf("email");
    const amountIdx = headers.indexOf("amount");
    const dateIdx = headers.indexOf("transaction_date");

    const missing = [];
    if (emailIdx === -1) missing.push("email");
    if (amountIdx === -1) missing.push("amount");
    if (dateIdx === -1) missing.push("transaction_date");

    if (missing.length > 0) {
      return NextResponse.json({
        error: `CSV is missing required columns: ${missing.join(", ")}`,
      });
    }

    const statusIdx = headers.indexOf("status");
    const descriptionIdx = headers.indexOf("description");
    const categoryIdx = headers.indexOf("category");
    const currencyIdx = headers.indexOf("currency");
    const transactionIdIdx = headers.indexOf("transaction_id");

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);

      try {
        const email = values[emailIdx]?.trim();
        const amountRaw = values[amountIdx]?.trim().replace(/[$,]/g, "");
        const dateRaw = values[dateIdx]?.trim();

        if (!email) {
          errors.push({ row: i + 1, error: "Missing email" });
          errorCount++;
          continue;
        }

        if (!amountRaw || isNaN(parseFloat(amountRaw))) {
          errors.push({
            row: i + 1,
            error: `Invalid amount: "${values[amountIdx]}"`,
          });
          errorCount++;
          continue;
        }

        const amount = parseFloat(amountRaw);

        if (!dateRaw || isNaN(new Date(dateRaw).getTime())) {
          errors.push({
            row: i + 1,
            error: `Invalid transaction_date: "${dateRaw}"`,
          });
          errorCount++;
          continue;
        }

        const transactionDate = new Date(dateRaw).toISOString();

        const customerResult = await query(
          `SELECT id FROM customers
           WHERE email = $1 AND organization_id = $2 AND deleted_at IS NULL
           LIMIT 1`,
          [email, organization_id],
        );

        if (!customerResult.rows[0]) {
          errors.push({
            row: i + 1,
            error: `No customer found with email "${email}" — import the customer profile first`,
          });
          errorCount++;
          continue;
        }

        const customerId = customerResult.rows[0].id;

        const rawStatus =
          statusIdx !== -1
            ? values[statusIdx]?.trim().toLowerCase()
            : "completed";
        const status = VALID_STATUSES.includes(rawStatus)
          ? rawStatus
          : "completed";
        const description =
          descriptionIdx !== -1 ? values[descriptionIdx]?.trim() || null : null;
        const category =
          categoryIdx !== -1 ? values[categoryIdx]?.trim() || null : null;
        const currency =
          currencyIdx !== -1
            ? values[currencyIdx]?.trim().toUpperCase() || "USD"
            : "USD";

        // Generate a transaction_id if not provided
        const transactionId =
          transactionIdIdx !== -1 && values[transactionIdIdx]?.trim()
            ? values[transactionIdIdx].trim()
            : `import_${customerId}_${Date.now()}_${i}`;

        await query(
          `INSERT INTO transactions
             (organization_id, customer_id, transaction_id, amount, currency,
              transaction_date, status, description, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (organization_id, transaction_id) DO UPDATE SET
             amount = EXCLUDED.amount,
             status = EXCLUDED.status,
             description = COALESCE(EXCLUDED.description, transactions.description),
             updated_at = NOW()`,
          [
            organization_id,
            customerId,
            transactionId,
            amount,
            currency,
            transactionDate,
            status,
            description,
            category,
          ],
        );

        // Update the customer's last_interaction timestamp if this is more recent
        await query(
          `UPDATE customers
           SET last_interaction = GREATEST(COALESCE(last_interaction, $1::timestamptz), $1::timestamptz),
               updated_at = NOW()
           WHERE id = $2`,
          [transactionDate, customerId],
        );

        successCount++;
      } catch (rowError) {
        errorCount++;
        errors.push({ row: i + 1, error: String(rowError) });
        console.error(`Transaction import row ${i + 1} error:`, rowError);
      }
    }

    recalculateOrgHealthScores(organization_id).catch((err) =>
      console.error(
        "Health score recalculation after transaction import failed:",
        err,
      ),
    );

    return NextResponse.json({
      success: true,
      imported: successCount,
      errors: errorCount,
      total: successCount + errorCount,
      error_sample: errors.slice(0, 10),
      message: `${successCount} transactions imported. Health scores are being recalculated.`,
    });
  } catch (error) {
    console.error("Transaction import error", error);
    return NextResponse.json(
      { error: "Failed to process transaction import" },
      { status: 500 },
    );
  }
}
