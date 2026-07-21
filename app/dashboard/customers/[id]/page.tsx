"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MoreHorizontal,
  MapPin,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  CreditCard,
  Clock,
  StickyNote,
  AlertTriangle,
  Archive,
  Trash2,
  X,
  Plus,
  CheckCircle,
} from "lucide-react";

import { formatDate, formatCurrency, timeAgo } from "@/utils";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  status: string;
  lifecycle_stage: string;
  health_score: number;
  churn_risk: string;
  notes?: string;
  created_at: string;
  last_interaction?: string;
  total_revenue: number;
  transaction_count: number;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  category?: string;
  transaction_date: string;
}

interface Event {
  id: string;
  event_type: string;
  event_name: string;
  event_date: string;
  properties?: Record<string, string>;
}

interface HealthBreakdown {
  recency: number;
  frequency: number;
  monetary: number;
  engagement: number;
  support: number;
}

function healthColor(s: number) {
  return s >= 70
    ? "text-green-600"
    : s >= 50
      ? "text-yellow-600"
      : s >= 50
        ? "text-ornge-500"
        : "text-red-600";
}

function healthBg(s: number) {
  return s >= 70
    ? "bg-green-500"
    : s >= 50
      ? "bg-yellow-500"
      : s >= 30
        ? "bg-orange-500"
        : "bg-red-500";
}

function riskBadge(r: string) {
  const m: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };

  return m[r] ?? "bg-muted text-muted-foreground";
}

function statusBadge(s: string) {
  const m: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-yellow-100 text-yellow-700",
    churned: "bg-red-100 text-red-700",
  };
  return m[s] ?? "bg-muted text-muted-foreground";
}

function eventDotColor(t: string) {
  return t === "note"
    ? "bg-blue-500"
    : t === "transaction"
      ? "bg-green-500"
      : t === "support"
        ? "bg-orange-500"
        : "bg-muted-foreground";
}

function eventIcon(t: string) {
  if (t === "note") return <StickyNote className="w-3 h-3" />;
  if (t === "transaction") return <CreditCard className="w-3 h-3" />;
  if (t === "support") return <AlertTriangle className="w-3 h-3" />;
  return <Clock className="w-3 h-3" />;
}

function ScoreBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}
          <span className="text-muted-foreground">/100</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${healthBg(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{weight} weight</p>
    </div>
  );
}

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [healthBreakdown, setHealthBreakdown] =
    useState<HealthBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "timeline"
  >("overview");

  const [editingStatus, setEditingStatus] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [accountAgeDays, setAccountAgeDays] = useState<number>(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/customers/${id}`);
        if (!res.ok) {
          router.push("/dashboard/customers");
          return;
        }
        const data = await res.json();
        setCustomer(data.customer);

        if (data.customer?.created_at) {
          const age = Math.floor(
            (Date.now() - new Date(data.customer.created_at).getTime()) /
              86_400_000,
          );
          setAccountAgeDays(age);
        }
        setTransactions(data.recent_transactions ?? []);
        setEvents(data.recent_events ?? []);
        setHealthBreakdown(data.health_breakdown ?? null);
      } catch (error) {
        console.error("Failed to loiad customer", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id, router]);

  useEffect(() => {
    if (!menuOpen) return;
    const h = () => setMenuOpen(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [menuOpen]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setCustomer((c) => (c ? { ...c, status: newStatus } : c));
    } finally {
      setStatusUpdating(false);
      setEditingStatus(false);
    }
  };

  const handleAddNote = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteSubmitting(true);

    try {
      const res = await fetch(`/api/customers/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Note", body: noteText }),
      });
      if (res.ok) {
        const newEvent = await res.json();
        setEvents((ev) => [newEvent, ...ev]);
        setNoteText("");
        setShowNoteForm(false);
        setNoteSuccess(true);
        setTimeout(() => setNoteSuccess(false), 3000);
      }
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      router.push("/dashboard/customers");
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== customer?.email) return;
    setDeleting(true);
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      router.push("/dashboard/customers");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-6 w-36 bg-muted rounded" />
        <div className="h-44 bg-muted rounded-xl" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  //   const accountAgeDays = useMemo(() => {
  //     if (!customer) return 0;
  //     return Math.floor(
  //       (Date.now() - new Date(customer.created_at).getTime()) / 86_400_000,
  //     );
  //   }, [customer]);

  if (!customer) return null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {(customer.full_name || customer.email)[0].toUpperCase()}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">
                {customer.full_name || "—"}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{customer.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: score + actions */}
          <div className="flex items-start gap-4">
            <div className="text-center">
              <div
                className={`text-4xl font-bold tabular-nums ${healthColor(customer.health_score)}`}
              >
                {customer.health_score}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Health Score
              </div>
              <span
                className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${riskBadge(customer.churn_risk)}`}
              >
                {customer.churn_risk} risk
              </span>
            </div>

            <div className="flex flex-col items-end gap-2">
              {editingStatus ? (
                <div className="flex items-center gap-1.5">
                  {["active", "inactive", "churned"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={statusUpdating}
                      className={`px-2.5 py-1 rounded text-xs font-semibold capitalize border transition ${customer.status === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="text-muted-foreground hover:text-foreground ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingStatus(true)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border border-transparent hover:opacity-80 transition ${statusBadge(customer.status)}`}
                >
                  {customer.status}
                </button>
              )}

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((o) => !o);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-10 z-50 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowArchive(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition text-left"
                    >
                      <Archive className="w-4 h-4 text-muted-foreground" />{" "}
                      Archive customer
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowDelete(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition text-left text-destructive"
                    >
                      <Trash2 className="w-4 h-4" /> Permanently delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Lifetime Value",
              value: formatCurrency(customer.total_revenue),
            },
            {
              label: "Transactions",
              value: String(customer.transaction_count),
            },
            {
              label: "Last Active",
              value: customer.last_interaction
                ? timeAgo(customer.last_interaction)
                : "Never",
            },
            { label: "Account Age", value: `${accountAgeDays}d` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-0">
        {(["overview", "transactions", "timeline"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 capitalize transition ${activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health breakdown */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Health Score
              Breakdown
            </h2>
            {healthBreakdown ? (
              <div className="space-y-4">
                <ScoreBar
                  label="Recency"
                  value={healthBreakdown.recency}
                  weight="30%"
                />
                <ScoreBar
                  label="Frequency"
                  value={healthBreakdown.frequency}
                  weight="25%"
                />
                <ScoreBar
                  label="Monetary"
                  value={healthBreakdown.monetary}
                  weight="20%"
                />
                <ScoreBar
                  label="Engagement"
                  value={healthBreakdown.engagement}
                  weight="15%"
                />
                <ScoreBar
                  label="Support"
                  value={healthBreakdown.support}
                  weight="10%"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Import transaction data to generate a full health breakdown.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {/* Details */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Details
              </h2>
              <div className="divide-y divide-border text-sm">
                {[
                  { label: "Lifecycle stage", value: customer.lifecycle_stage },
                  {
                    label: "Customer since",
                    value: formatDate(customer.created_at),
                  },
                  {
                    label: "Last interaction",
                    value: customer.last_interaction
                      ? formatDate(customer.last_interaction)
                      : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" /> Notes
                </h2>
                <button
                  onClick={() => setShowNoteForm((v) => !v)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add note
                </button>
              </div>
              {noteSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Note saved
                </div>
              )}
              {showNoteForm && (
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note about this customer..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={noteSubmitting || !noteText.trim()}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                    >
                      {noteSubmitting ? "Saving..." : "Save note"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNoteForm(false);
                        setNoteText("");
                      }}
                      className="px-3 py-1.5 border border-border text-xs font-semibold rounded-lg hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {customer.notes ? (
                <p className="text-sm text-muted-foreground">
                  {customer.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No notes yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === "transactions" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CreditCard className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm text-muted-foreground">
                Import transaction history to see this customer&apos;s purchase
                records.
              </p>
              <Link
                href="/dashboard/import"
                className="inline-block mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition"
              >
                Import Transactions
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {["Date", "Description", "Category", "Amount", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`py-3 px-4 font-semibold ${h === "Amount" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-border hover:bg-muted/40 transition ${i === transactions.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td className="py-3 px-4">{tx.description || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">
                      {tx.category || "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${tx.status === "completed" ? "bg-green-100 text-green-700" : tx.status === "refunded" ? "bg-orange-100 text-orange-700" : tx.status === "failed" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setActiveTab("overview");
                setShowNoteForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              <Plus className="w-4 h-4" /> Add note
            </button>
          </div>
          {events.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center space-y-2">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="font-medium">No timeline events yet</p>
              <p className="text-sm text-muted-foreground">
                Events will appear here as you import transactions and add
                notes.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-4 p-4 hover:bg-muted/30 transition"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 ${eventDotColor(event.event_type)}`}
                  >
                    {eventIcon(event.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {event.event_name}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {timeAgo(event.event_date)}
                      </span>
                    </div>
                    {event.properties?.body && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {event.properties.body}
                      </p>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">
                      {formatDate(event.event_date)} · {event.event_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Archive modal */}
      {showArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Archive className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">Archive customer?</h2>
                <p className="text-sm text-muted-foreground">
                  Marks as inactive. All history is preserved.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                {archiving ? "Archiving..." : "Archive customer"}
              </button>
              <button
                onClick={() => setShowArchive(false)}
                className="flex-1 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-destructive/30 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold text-destructive">
                  Permanently delete customer
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This deletes <strong>{customer.full_name}</strong> and all
                  their history. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Type{" "}
                <span className="font-mono font-bold text-foreground">
                  {customer.email}
                </span>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={customer.email}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-destructive"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== customer.email}
                className="flex-1 py-2 bg-destructive text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
              <button
                onClick={() => {
                  setShowDelete(false);
                  setDeleteConfirm("");
                }}
                className="flex-1 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}