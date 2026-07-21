import { query } from "./db";

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

// ─── Pure calculation (no DB) ─────────────────────────────────────────────────

export function computeHealthScore(
  customer: CustomerHealthData,
  baselines: OrgBaselines,
): HealthScoreResult {
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

  const avgTx = Math.max(baselines.avg_transactions_90d, 0.1);
  const frequency = Math.min(
    100,
    Math.round((customer.transaction_count_90d / avgTx) * 60 + 10),
  );

  const avgRev = Math.max(baselines.avg_revenue, 1);
  const monetary =
    customer.total_revenue > 0
      ? Math.min(100, Math.round((customer.total_revenue / avgRev) * 60 + 10))
      : 10;

  const avgEv = Math.max(baselines.avg_events_30d, 0.1);
  const engagement =
    customer.event_count_30d > 0
      ? Math.min(100, Math.round((customer.event_count_30d / avgEv) * 60 + 10))
      : 15;

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
    score >= 70
      ? "low"
      : score >= 50
        ? "medium"
        : score >= 30
          ? "high"
          : "critical";

  return {
    score,
    churn_risk,
    breakdown: { recency, frequency, monetary, engagement, support },
  };
}

// ─── Org-level baselines (3 separate queries — no cross join) ─────────────────

async function fetchOrgBaselines(
  organizationId: string,
): Promise<OrgBaselines> {
  const [txResult, revResult, evResult] = await Promise.all([
    query(
      `SELECT COALESCE(AVG(cnt), 0.1) AS avg_transactions_90d
       FROM (
         SELECT t.customer_id, COUNT(*) AS cnt
         FROM transactions t
         JOIN customers c ON c.id = t.customer_id
         WHERE c.organization_id = $1
           AND t.transaction_date >= NOW() - INTERVAL '90 days'
         GROUP BY t.customer_id
       ) sub`,
      [organizationId],
    ),
    query(
      `SELECT COALESCE(AVG(total), 1) AS avg_revenue
       FROM (
         SELECT t.customer_id, SUM(t.amount) AS total
         FROM transactions t
         JOIN customers c ON c.id = t.customer_id
         WHERE c.organization_id = $1 AND t.status = 'completed'
         GROUP BY t.customer_id
       ) sub`,
      [organizationId],
    ),
    query(
      `SELECT COALESCE(AVG(cnt), 0.1) AS avg_events_30d
       FROM (
         SELECT e.customer_id, COUNT(*) AS cnt
         FROM events e
         JOIN customers c ON c.id = e.customer_id
         WHERE c.organization_id = $1
           AND e.event_date >= NOW() - INTERVAL '30 days'
         GROUP BY e.customer_id
       ) sub`,
      [organizationId],
    ),
  ]);

  return {
    avg_transactions_90d:
      parseFloat(txResult.rows[0]?.avg_transactions_90d) || 0.1,
    avg_revenue: parseFloat(revResult.rows[0]?.avg_revenue) || 1,
    avg_events_30d: parseFloat(evResult.rows[0]?.avg_events_30d) || 0.1,
  };
}

// ─── Per-customer activity ────────────────────────────────────────────────────

async function fetchCustomerActivity(organizationId: string) {
  const result = await query(
    `SELECT
       c.id,
       c.last_interaction,
       COALESCE(rev.total_revenue, 0)  AS total_revenue,
       COALESCE(tx.cnt_90d, 0)         AS transaction_count_90d,
       COALESCE(ev.cnt_30d, 0)         AS event_count_30d,
       COALESCE(sup.cnt_90d, 0)        AS support_count_90d
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, SUM(amount) AS total_revenue
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
       WHERE event_type = 'support'
         AND event_date >= NOW() - INTERVAL '90 days'
       GROUP BY customer_id
     ) sup ON sup.customer_id = c.id
     WHERE c.organization_id = $1 AND c.deleted_at IS NULL`,
    [organizationId],
  );

  return result.rows;
}

// ─── Public: batch recalculation ─────────────────────────────────────────────

export async function recalculateOrgHealthScores(
  organizationId: string,
): Promise<{ updated: number }> {
  const [baselines, customers] = await Promise.all([
    fetchOrgBaselines(organizationId),
    fetchCustomerActivity(organizationId),
  ]);

  let updated = 0;

  for (const row of customers) {
    const { score, churn_risk } = computeHealthScore(
      {
        id: row.id,
        last_interaction: row.last_interaction,
        total_revenue: parseFloat(row.total_revenue) || 0,
        transaction_count_90d: parseInt(row.transaction_count_90d) || 0,
        event_count_30d: parseInt(row.event_count_30d) || 0,
        support_count_90d: parseInt(row.support_count_90d) || 0,
      },
      baselines,
    );

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

// ─── Public: single customer breakdown (for 360 profile) ─────────────────────

export async function getCustomerHealthBreakdown(
  customerId: string,
  organizationId: string,
): Promise<HealthScoreResult | null> {
  const [baselines, customerResult] = await Promise.all([
    fetchOrgBaselines(organizationId),
    query(
      `SELECT
         c.id,
         c.last_interaction,
         COALESCE(rev.total_revenue, 0)  AS total_revenue,
         COALESCE(tx.cnt_90d, 0)         AS transaction_count_90d,
         COALESCE(ev.cnt_30d, 0)         AS event_count_30d,
         COALESCE(sup.cnt_90d, 0)        AS support_count_90d
       FROM customers c
       LEFT JOIN (
         SELECT customer_id, SUM(amount) AS total_revenue
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
         WHERE event_type = 'support'
           AND event_date >= NOW() - INTERVAL '90 days'
         GROUP BY customer_id
       ) sup ON sup.customer_id = c.id
       WHERE c.id = $1 AND c.organization_id = $2`,
      [customerId, organizationId],
    ),
  ]);

  const row = customerResult.rows[0];
  if (!row) return null;

  return computeHealthScore(
    {
      id: row.id,
      last_interaction: row.last_interaction,
      total_revenue: parseFloat(row.total_revenue) || 0,
      transaction_count_90d: parseInt(row.transaction_count_90d) || 0,
      event_count_30d: parseInt(row.event_count_30d) || 0,
      support_count_90d: parseInt(row.support_count_90d) || 0,
    },
    baselines,
  );
}
