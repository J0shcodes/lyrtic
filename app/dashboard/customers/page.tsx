"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  health_score: number;
  churn_risk: string;
  status: string;
  location?: string;
  total_revenue?: number;
  transaction_count?: number;
}

const RISK_STYLE: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-yellow-100 text-yellow-700",
  churned: "bg-red-100 text-red-700",
};

function healthBarColor(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "1",
    full_name: "Acme Corp",
    email: "contact@acme.com",
    health_score: 85,
    churn_risk: "low",
    status: "active",
  },
  {
    id: "2",
    full_name: "TechStart Inc",
    email: "hello@techstart.com",
    health_score: 52,
    churn_risk: "high",
    status: "active",
  },
  {
    id: "3",
    full_name: "Global Solutions",
    email: "info@globalsol.com",
    health_score: 78,
    churn_risk: "medium",
    status: "active",
  },
];

export default function CustomersPage() {
  const queryClient = useQueryClient();

  // const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers", { sortBy, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ sort: sortBy });
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      customerId,
      newStatus,
    }: {
      customerId: string;
      newStatus: string;
    }) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  // const fetchCustomers = useCallback(async () => {
  //   try {
  //     const params = new URLSearchParams({ sort: sortBy });
  //     if (statusFilter) params.set("status", statusFilter);
  //     if (searchTerm) params.set("q", searchTerm);

  //     const response = await fetch(`/api/customers?${params}`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       setCustomers(data);
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch customers:", error);
  //     // Mock data for demo
  //     setCustomers([
  //       {
  //         id: "1",
  //         full_name: "Acme Corp",
  //         email: "contact@acme.com",
  //         health_score: 85,
  //         churn_risk: "low",
  //         status: "active",
  //       },
  //       {
  //         id: "2",
  //         full_name: "TechStart Inc",
  //         email: "hello@techstart.com",
  //         health_score: 52,
  //         churn_risk: "high",
  //         status: "active",
  //       },
  //       {
  //         id: "3",
  //         full_name: "Global Solutions",
  //         email: "info@globalsol.com",
  //         health_score: 78,
  //         churn_risk: "medium",
  //         status: "active",
  //       },
  //     ]);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [sortBy, statusFilter]);

  // useEffect(() => {
  //   fetchCustomers();
  // }, [fetchCustomers]);

  useEffect(() => {
    if (!openStatusMenu) return;

    const h = () => setOpenStatusMenu(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [openStatusMenu]);

  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   fetchCustomers();
  // };

  const handleStatusChange = async (customerId: string, newStatus: string) => {
    // setUpdatingStatus(customerId);
    setOpenStatusMenu(null);
    statusMutation.mutate({ customerId, newStatus });
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "high":
      case "critical":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading..." : `${customers.length} customers`}
          </p>
        </div>
        <Link
          href="/dashboard/import"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition"
        >
          <Plus className="w-5 h-5" />
          Import Customers
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 flex-wrap">
        <form className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="churned">Churned</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="created_at">Newest first</option>
          <option value="health_score">Health score</option>
          <option value="full_name">Name A–Z</option>
          <option value="churn_risk">Churn risk</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="mb-2">No customers found</p>
            <p className="text-sm text-muted-foreground">
              {customers.length === 0
                ? "Import your first CSV to get started"
                : "Try adjusting your search or filters"}
            </p>
            {customers.length === 0 && (
              <Link
                href="/dashboard/import"
                className="inline-block mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition"
              >
                Import Customers
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Health Score</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Churn Risk
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, i) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-border hover:bg-muted/40 transition ${i === filteredCustomers.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="py-3 px-4 font-medium">
                      {customer.full_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${healthBarColor(customer.health_score)}`}
                            style={{ width: `${customer.health_score}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs font-medium">
                          {customer.health_score}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${RISK_STYLE[customer.churn_risk] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {customer.churn_risk}
                      </span>
                    </td>

                    {/* Inline status selector */}
                    <td className="py-3 px-4">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenStatusMenu(
                              openStatusMenu === customer.id
                                ? null
                                : customer.id,
                            );
                          }}
                          disabled={updatingStatus === customer.id}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize border border-transparent hover:border-border transition ${STATUS_STYLE[customer.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {updatingStatus === customer.id
                            ? "…"
                            : customer.status}
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>
                        {openStatusMenu === customer.id && (
                          <div className="absolute left-0 top-7 z-50 w-32 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                            {["active", "inactive", "churned"].map((s) => (
                              <button
                                key={s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(customer.id, s);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs capitalize hover:bg-muted transition ${customer.status === s ? "font-semibold" : ""}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground tabular-nums">
                      {customer.total_revenue != null
                        ? `$${Number(customer.total_revenue).toLocaleString()}`
                        : "—"}
                    </td>

                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/customers/${customer.id}`}
                        className="text-primary text-xs font-semibold hover:underline whitespace-nowrap"
                      >
                        View →
                      </Link>
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
