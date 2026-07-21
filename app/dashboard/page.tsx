"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { DashboardMetrics, RecentCustomer } from "@/lib/types";
import { HttpError } from "@/lib/http-error";
import { StatCard } from "@/components/ui/StatCard";

const RISK_STYLE: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function healthBarColor(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

const fetchMetrics = async (): Promise<DashboardMetrics> => {
  const response = await fetch("/api/dashboard/metrics");

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new HttpError(
      errorData.error || "Failed to fetch metrics",
      response.status,
    );
  }

  return response.json();
};

const fetchRecentCustomers = async (): Promise<RecentCustomer[]> => {
  const response = await fetch("/api/customers?limit=5&sort=created_at");
  if (!response.ok) throw new Error("Failed to fetch customers");
  return response.json();
};

export default function DashboardPage() {
  // const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  // const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([]);

  const router = useRouter();

  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardMetrics, HttpError>({
    queryKey: ["dashboard", "metrics"],
    queryFn: fetchMetrics,
    retry: (failureCount, error) => {
      if (error.status === 401) return false;
      return failureCount < 3;
    },
  });

  const {
    data: recentCustomers,
    isLoading: isLoadingCustomers,
    isError: isCustomersError,
  } = useQuery({
    queryKey: ["customers", { limit: 5, sort: "created_at" }],
    queryFn: fetchRecentCustomers,
  });

  useEffect(() => {
    if (error instanceof HttpError && error.status === 401) {
      router.push("/sign-in");
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="border border-border rounded-lg p-6 animate-pulse bg-muted/50 h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  const retentionRate = metrics
    ? Math.round(
        (metrics.activeCustomers / Math.max(metrics.totalCustomers, 1)) * 100,
      )
    : 0;

  if (isError && error.status !== 401) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
        {error.message || "An unexpected error occurred while loading metrics."}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your customers.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Customers"
          value={metrics?.totalCustomers ?? 0}
          subtitle="Active in your account"
          icon={<Users className="w-6 h-6 text-primary" />}
          trend={{ value: 12, isPositive: true }}
        />

        <StatCard
          title="Average Health Score"
          value={`${metrics?.averageHealthScore ?? 0}%`}
          subtitle="Composite customer health"
          icon={<BarChart3 className="w-6 h-6 text-primary" />}
          variant="success"
        />

        <StatCard
          title="At Critical Risk"
          value={metrics?.criticalRiskCount ?? 0}
          subtitle="Customers at high churn risk"
          icon={<AlertTriangle className="w-6 h-6 text-destructive" />}
          variant="warning"
          trend={{ value: 8, isPositive: false }}
        />

        <StatCard
          title="Active Customers"
          value={metrics?.activeCustomers ?? 0}
          subtitle={`${retentionRate}% retention rate`}
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
          trend={{ value: 5, isPositive: true }}
        />

        <StatCard
          title="Churned Customers"
          value={metrics?.churnedCustomers || 0}
          subtitle="In the last 30 days"
          icon={<Users className="w-6 h-6 text-muted-foreground" />}
        />

        <StatCard
          title="Total Revenue"
          value={`$${(metrics?.totalRevenue || 0).toLocaleString()}`}
          subtitle="From active customers"
          icon={<BarChart3 className="w-6 h-6 text-primary" />}
          trend={{ value: 18, isPositive: true }}
        />
      </div>

      {/* Health distribution */}
      {metrics?.healthDistribution && metrics.totalCustomers > 0 && (
        <div className="border border-border rounded-lg p-6 bg-card space-y-4">
          <h3 className="text-lg font-semibold">Health Distribution</h3>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {[
              {
                key: "healthy",
                label: "Healthy (70–100)",
                color: "bg-green-500",
                count: metrics.healthDistribution.healthy,
              },
              {
                key: "at_risk",
                label: "At Risk (50–69)",
                color: "bg-yellow-500",
                count: metrics.healthDistribution.at_risk,
              },
              {
                key: "high_risk",
                label: "High Risk (30–49)",
                color: "bg-orange-500",
                count: metrics.healthDistribution.high_risk,
              },
              {
                key: "critical",
                label: "Critical (0–29)",
                color: "bg-red-500",
                count: metrics.healthDistribution.critical,
              },
            ].map(({ key, color, count }) => {
              const pct = Math.round((count / metrics.totalCustomers) * 100);
              return pct > 0 ? (
                <div
                  key={key}
                  className={`${color} h-full`}
                  style={{ width: `${pct}%` }}
                  title={`${count} customers`}
                />
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {[
              {
                label: "Healthy (70–100)",
                color: "bg-green-500",
                count: metrics.healthDistribution.healthy,
              },
              {
                label: "At Risk (50–69)",
                color: "bg-yellow-500",
                count: metrics.healthDistribution.at_risk,
              },
              {
                label: "High Risk (30–49)",
                color: "bg-orange-500",
                count: metrics.healthDistribution.high_risk,
              },
              {
                label: "Critical (0–29)",
                color: "bg-red-500",
                count: metrics.healthDistribution.critical,
              },
            ].map(({ label, color, count }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span>
                  {label}: <strong className="text-foreground">{count}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Data */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Import Customer Data</h3>
            <p className="text-sm text-muted-foreground">
              Upload customer profiles and transaction history to power health
              scoring.
            </p>
          </div>
          <Link
            href="/dashboard/import"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
          >
            Start Import
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* AI Insights */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">AI-Powered Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get AI-generated insights about your customer base and churn risks
            </p>
          </div>
          <Link
            href="/dashboard/insights"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-muted transition"
          >
            View Insights
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top at-risk customers */}
      {metrics?.topAtRisk && metrics.topAtRisk.length > 0 && (
        <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Top At-Risk Customers
            </h3>
            <Link
              href="/dashboard/customers?status=active"
              className="text-primary text-sm font-semibold hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {metrics.topAtRisk.map((c) => (
              <div
                key={c.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {c.full_name || c.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.email}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${RISK_STYLE[c.churn_risk] ?? ""}`}
                  >
                    {c.churn_risk}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    Score: {c.health_score}
                  </span>
                  <Link
                    href={`/dashboard/customers/${c.id}`}
                    className="text-primary text-xs font-semibold hover:underline"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Customers */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Customers</h3>
          <Link
            href="/dashboard/customers"
            className="text-primary text-sm font-semibold hover:underline"
          >
            View all
          </Link>
        </div>

        {!recentCustomers || recentCustomers.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground text-sm">No customers yet.</p>
            <Link
              href="/dashboard/import"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition"
            >
              Import your first CSV
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  {["Name", "Email", "Health", "Churn Risk", "Revenue"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-border hover:bg-muted/30 transition ${i === recentCustomers.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="py-3 font-medium">
                      <Link
                        href={`/dashboard/customers/${c.id}`}
                        className="hover:text-primary transition"
                      >
                        {c.full_name || "—"}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{c.email}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${healthBarColor(c.health_score)}`}
                            style={{ width: `${c.health_score}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums">
                          {c.health_score}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${RISK_STYLE[c.churn_risk] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {c.churn_risk}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground tabular-nums text-xs">
                      {c.total_revenue != null
                        ? `$${Number(c.total_revenue).toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
