"use client";

import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  health_score: number;
  churn_risk: string;
  status: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        // Mock data for demo
        setCustomers([
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
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

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
            Manage and analyze your customer database
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Customers Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="mb-2">No customers found</p>
            <p className="text-sm">
              Import your first customer data to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Health Score
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Churn Risk
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, i) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-border hover:bg-muted/50 transition ${
                      i === filteredCustomers.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-medium">
                      {customer.full_name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {customer.email}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {customer.health_score}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRiskColor(customer.churn_risk)}`}
                      >
                        {customer.churn_risk}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 capitalize">
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-primary text-sm font-semibold hover:underline">
                        View
                      </button>
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
