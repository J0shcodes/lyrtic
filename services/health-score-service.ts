import { query } from "@/lib/db";

interface CustomerHealthData {
  id: string;
  last_interaction: string | null;
  total_revenue: number;
  transaction_count_90d: number;
  event_count_30d: number;
  support_count_90d: number;
}

interface OrgBaselines {
  avg_transactions_90d: number;
  avg_revenue: number;
  avg_events_30d: number;
}

export interface HealthScoreResult {
  score: number;
  churn_risk: "low" | "medium" | "high" | "critical";
  breakdown: {
    recency: number;
    frequency: number;
    monetary: number;
    engagement: number;
    support: number;
  };
}

// --- Pure calculation (testable without DB) ---

export function computeHealthScore(
  customer: CustomerHealthData,
  baselines: OrgBaselines,
): HealthScoreResult {
  // Recency (30%) ── days since last transaction or interaction
  const daysSince = customer.last_interaction
    ? Math.floor(
        (Date.now() - new Date(customer.last_interaction).getTime()) /
          86_400_000,
      )
    : 365;

  const recency =
    daysSince < 7
      ? 100
      : daysSince < 30
        ? 75
        : daysSince < 60
          ? 50
          : daysSince < 90
            ? 25
            : 0;

  // Frequency (25%) ── transactions in last 90d vs org average
  const avgTx = Math.max(baselines.avg_transactions_90d, 0.1);
  const frequency = Math.min(
    100,
    Math.round((customer.transaction_count_90d / avgTx) * 60 + 10),
  );

  // Monetary (20%) ── LTV vs org average
  const avgRev = Math.max(baselines.avg_revenue, 1);
  const monetary = Math.min(
    100,
    customer.total_revenue > 0
      ? Math.round((customer.total_revenue / avgRev) * 60 + 10)
      : 10,
  );

  // Engagement (15%) ── events in last 30d vs org average
  const avgEv = Math.max(baselines.avg_events_30d, 0.1);
  const engagement =
    customer.event_count_30d > 0
      ? Math.min(100, Math.round((customer.event_count_30d / avgEv) * 60 + 10))
      : 15;

  // Support (10%) ── inverse: more tickets → lower score
  const support =
    customer.support_count_90d === 0
      ? 100
      : customer.support_count_90d === 1
        ? 75
        : customer.support_count_90d <= 3
          ? 50
          : 25;

  const score = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        recency * 0.3 +
          frequency * 0.25 +
          monetary * 0.2 +
          engagement * 0.15 +
          support * 0.1,
      ),
    ),
  );

  const churn_risk: HealthScoreResult["churn_risk"] =
    score >= 70 ? "low" : score >= 50 ? "medium" : score >= 30 ? "high" : "critical";

  return {
    score,
    churn_risk,
    breakdown: { recency, frequency, monetary, engagement, support },
  };
}

// --- DB-backed recalculation ---

export async function recalculateOrgHealthScores(
  organizationId: string,
): Promise<{ updated: number }> {
  // Org-level baselines for normalization
  const baselineResult = await query(
    `SELECT
        COALESCE(AVG(tx.cnt), 0.1)  AS avg_transactions_90d,
        COALESCE(AVG(c.total_txn_revenue), 1) AS avg_revenue,
        COALESCE(AVG(ev.cnt), 0.1)  AS avg_events_30d
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt
       FROM transactions
       WHERE transaction_date >= NOW() - INTERVAL '90 days'
       GROUP BY customer_id
     ) tx ON tx.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COALESCE(SUM(amount), 0) AS total_txn_revenue
       FROM transactions
       WHERE status = 'completed'
       GROUP BY customer_id
     ) rev ON rev.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt
       FROM events
       WHERE event_date >= NOW() - INTERVAL '30 days'
       GROUP BY customer_id
     ) ev ON ev.customer_id = c.id
     CROSS JOIN (
       SELECT COALESCE(SUM(amount), 0) AS total_txn_revenue
       FROM transactions t
       JOIN customers cc ON cc.id = t.customer_id
       WHERE cc.organization_id = $1 AND t.status = 'completed'
     ) total_rev_placeholder
     WHERE c.organization_id = $1 AND c.deleted_at IS NULL`,
    [organizationId],
  );

  const baselines: OrgBaselines = {
    avg_transactions_90d:
      parseFloat(baselineResult.rows[0]?.avg_transactions_90d) || 0.1,
    avg_revenue: parseFloat(baselineResult.rows[0]?.avg_revenue) || 1,
    avg_events_30d: parseFloat(baselineResult.rows[0]?.avg_events_30d) || 0.1,
  };

  // Fetch every customer with their aggregated activity
  const customersResult = await query(
    `SELECT
        c.id,
        c.last_interaction,
        COALESCE(rev.total_revenue, 0)   AS total_revenue,
        COALESCE(tx.cnt_90d, 0)          AS transaction_count_90d,
        COALESCE(ev.cnt_30d, 0)          AS event_count_30d,
        COALESCE(sup.cnt_90d, 0)         AS support_count_90d
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, COALESCE(SUM(amount), 0) AS total_revenue
       FROM transactions WHERE status = 'completed'
       GROUP BY customer_id
     ) rev ON rev.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt_90d
       FROM transactions
       WHERE transaction_date >= NOW() - INTERVAL '90 days'
       GROUP BY customer_id
     ) tx ON tx.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt_30d
       FROM events
       WHERE event_date >= NOW() - INTERVAL '30 days'
       GROUP BY customer_id
     ) ev ON ev.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt_90d
       FROM events
       WHERE event_type = 'support' AND event_date >= NOW() - INTERVAL '90 days'
       GROUP BY customer_id
     ) sup ON sup.customer_id = c.id
     WHERE c.organization_id = $1 AND c.deleted_at IS NULL`,
    [organizationId],
  );

  let updated = 0;

  for (const row of customersResult.rows) {
    const customerData: CustomerHealthData = {
      id: row.id,
      last_interaction: row.last_interaction,
      total_revenue: parseFloat(row.total_revenue) || 0,
      transaction_count_90d: parseInt(row.transaction_count_90d) || 0,
      event_count_30d: parseInt(row.event_count_30d) || 0,
      support_count_90d: parseInt(row.support_count_90d) || 0,
    };

    const { score, churn_risk } = computeHealthScore(customerData, baselines);

    await query(
      `UPDATE customers
       SET health_score = $1, churn_risk = $2, updated_at = NOW()
       WHERE id = $3`,
      [score, churn_risk, row.id],
    );
    updated++;
  }

  return { updated };
}

/**
 * Compute a single customer's score using current org baselines.
 * Returns score + breakdown for display on the 360 profile.
 */
export async function getCustomerHealthBreakdown(
  customerId: string,
  organizationId: string,
): Promise<HealthScoreResult | null> {
  const result = await query(
    `SELECT
        c.id,
        c.last_interaction,
        COALESCE(rev.total_revenue, 0)  AS total_revenue,
        COALESCE(tx.cnt_90d, 0)         AS transaction_count_90d,
        COALESCE(ev.cnt_30d, 0)         AS event_count_30d,
        COALESCE(sup.cnt_90d, 0)        AS support_count_90d,
        -- org baselines
        COALESCE(org_tx.avg_tx, 0.1)   AS avg_transactions_90d,
        COALESCE(org_rev.avg_rev, 1)   AS avg_revenue,
        COALESCE(org_ev.avg_ev, 0.1)   AS avg_events_30d
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, SUM(amount) AS total_revenue FROM transactions
       WHERE status = 'completed' GROUP BY customer_id
     ) rev ON rev.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt_90d FROM transactions
       WHERE transaction_date >= NOW() - INTERVAL '90 days'
       GROUP BY customer_id
     ) tx ON tx.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt_30d FROM events
       WHERE event_date >= NOW() - INTERVAL '30 days'
       GROUP BY customer_id
     ) ev ON ev.customer_id = c.id
     LEFT JOIN (
       SELECT customer_id, COUNT(*) AS cnt_90d FROM events
       WHERE event_type = 'support' AND event_date >= NOW() - INTERVAL '90 days'
       GROUP BY customer_id
     ) sup ON sup.customer_id = c.id
     -- org baselines (cross-joined from org aggregate)
     CROSS JOIN (
       SELECT COALESCE(AVG(cnt), 0.1) AS avg_tx FROM (
         SELECT customer_id, COUNT(*) AS cnt FROM transactions
         JOIN customers cc ON cc.id = transactions.customer_id
         WHERE cc.organization_id = $2
           AND transaction_date >= NOW() - INTERVAL '90 days'
         GROUP BY customer_id
       ) sub
     ) org_tx
     CROSS JOIN (
       SELECT COALESCE(AVG(total), 1) AS avg_rev FROM (
         SELECT customer_id, SUM(amount) AS total FROM transactions
         JOIN customers cc ON cc.id = transactions.customer_id
         WHERE cc.organization_id = $2 AND status = 'completed'
         GROUP BY customer_id
       ) sub
     ) org_rev
     CROSS JOIN (
       SELECT COALESCE(AVG(cnt), 0.1) AS avg_ev FROM (
         SELECT customer_id, COUNT(*) AS cnt FROM events
         JOIN customers cc ON cc.id = events.customer_id
         WHERE cc.organization_id = $2
           AND event_date >= NOW() - INTERVAL '30 days'
         GROUP BY customer_id
       ) sub
     ) org_ev
     WHERE c.id = $1 AND c.organization_id = $2`,
    [customerId, organizationId],
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return computeHealthScore(
    {
      id: row.id,
      last_interaction: row.last_interaction,
      total_revenue: parseFloat(row.total_revenue) || 0,
      transaction_count_90d: parseInt(row.transaction_count_90d) || 0,
      event_count_30d: parseInt(row.event_count_30d) || 0,
      support_count_90d: parseInt(row.support_count_90d) || 0,
    },
    {
      avg_transactions_90d: parseFloat(row.avg_transactions_90d) || 0.1,
      avg_revenue: parseFloat(row.avg_revenue) || 1,
      avg_events_30d: parseFloat(row.avg_events_30d) || 0.1,
    },
  );
}