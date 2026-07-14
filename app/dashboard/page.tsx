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
import { DashboardMetrics } from "@/lib/types";
import { HttpError } from "@/lib/http-error";
import { StatCard } from "@/components/ui/StatCard";

// interface DashboardMetrics {
//   totalCustomers: number;
//   activeCustomers: number;
//   churnedCustomers: number;
//   averageHealthScore: number;
//   criticalRiskCount: number;
//   totalRevenue: number;
// }

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

export default function DashboardPage() {

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
          value={metrics?.totalCustomers || 0}
          subtitle="Active in your account"
          icon={<Users className="w-6 h-6 text-primary" />}
          trend={{ value: 12, isPositive: true }}
        />

        <StatCard
          title="Average Health Score"
          value={`${metrics?.averageHealthScore || 0}%`}
          subtitle="Composite customer health"
          icon={<BarChart3 className="w-6 h-6 text-primary" />}
          variant="success"
        />

        <StatCard
          title="At Critical Risk"
          value={metrics?.criticalRiskCount || 0}
          subtitle="Customers at high churn risk"
          icon={<AlertTriangle className="w-6 h-6 text-destructive" />}
          variant="warning"
          trend={{ value: 8, isPositive: false }}
        />

        <StatCard
          title="Active Customers"
          value={metrics?.activeCustomers || 0}
          subtitle={`${Math.round(((metrics?.activeCustomers || 0) / (metrics?.totalCustomers || 1)) * 100)}% retention rate`}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Data */}
        <div className="border border-border rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Import Customer Data</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to get started analyzing your customers
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 font-semibold">Name</th>
                <th className="text-left py-3 font-semibold">Email</th>
                <th className="text-left py-3 font-semibold">Health Score</th>
                <th className="text-left py-3 font-semibold">Churn Risk</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: "Acme Corp",
                  email: "contact@acme.com",
                  score: 85,
                  risk: "Low",
                },
                {
                  name: "TechStart Inc",
                  email: "hello@techstart.com",
                  score: 52,
                  risk: "High",
                },
                {
                  name: "Global Solutions",
                  email: "info@globalsol.com",
                  score: 78,
                  risk: "Medium",
                },
              ].map((customer, i) => (
                <tr
                  key={i}
                  className="border-b border-border hover:bg-muted/50 transition"
                >
                  <td className="py-3">{customer.name}</td>
                  <td className="py-3 text-muted-foreground">
                    {customer.email}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {customer.score}%
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        customer.risk === "Low"
                          ? "bg-green-100 text-green-700"
                          : customer.risk === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {customer.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
