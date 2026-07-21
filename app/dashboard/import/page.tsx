"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  CreditCard,
  RefreshCw
} from "lucide-react";

type ImportType = "customers" | "transactions";

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  total: number;
  message?: string;
  error_sample?: Array<{ row: number; error: string }>;
}

interface RecalcResult {
  success: boolean;
  updated?: number;
  message?: string;
  error?: string;
}

const IMPORT_CONFIG = {
  customers: {
    endpoint: "/api/import",
    label: "Customer Profiles",
    icon: Users,
    description:
      "Import your customer list — names, emails, locations, and statuses.",
    requiredColumns: ["email", "full_name"],
    optionalColumns: [
      "phone",
      "location",
      "customer_id",
      "status",
      "lifecycle_stage",
      "notes",
    ],
    validStatuses: ["active", "inactive", "churned"],
    validStages: ["lead", "prospect", "customer", "churned"],
    exampleCsv: `email,full_name,phone,location,status,lifecycle_stage,notes
sarah.chen@acme.com,Sarah Chen,+1-415-555-0192,San Francisco CA,active,customer,Enterprise plan
daniel.oba@techwave.io,Daniel Oba,,London UK,active,customer,Growth plan
priya.sharma@labs.in,Priya Sharma,,Bangalore India,inactive,customer,No login in 45 days`,
  },
  transactions: {
    endpoint: "/api/import/transactions",
    label: "Transaction History",
    icon: CreditCard,
    description:
      "Import purchase history to power health scores and churn prediction.",
    requiredColumns: ["email", "amount", "transaction_date"],
    optionalColumns: [
      "transaction_id",
      "status",
      "description",
      "category",
      "currency",
    ],
    validStatuses: ["completed", "pending", "failed", "refunded"],
    validStages: [],
    exampleCsv: `email,amount,transaction_date,status,description,category
sarah.chen@acme.com,299.00,2025-05-15,completed,Growth Plan - Monthly,subscription
daniel.oba@techwave.io,899.00,2025-04-01,completed,Enterprise Plan - Q2,subscription
priya.sharma@labs.in,99.00,2024-12-10,completed,Starter Plan,subscription`,
  },
};

function UploadZone({
  file,
  onFile,
  uploading,
  dragActive,
  onDrag,
  onDrop,
}: {
  file: File | null;
  onFile: (f: File) => void;
  uploading: boolean;
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-lg p-12 text-center transition ${
        dragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <input
        type="file"
        id="file-input"
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        className="hidden"
        disabled={uploading}
      />
      <label
        htmlFor="file-input"
        className="cursor-pointer space-y-3 flex flex-col items-center"
      >
        {!file ? (
          <>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-semibold mb-1">
                Drag and drop your CSV file
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
          </>
        ) : (
          <>
            <FileText className="w-12 h-12 text-primary mx-auto" />
            <div>
              <p className="text-lg font-semibold mb-1">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </>
        )}
      </label>
    </div>
  );
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<ImportType>("customers");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<RecalcResult | null>(null);

  const config = IMPORT_CONFIG[activeTab];
  const Icon = config.icon;

  const handleTabChange = (tab: ImportType) => {
    setActiveTab(tab);
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + 10 : prev));
    }, 200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(config.endpoint, {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        // const data = await response.json();
        // console.log("Import successful:", data);
        setFile(null);
        const input = document.getElementById("file-input") as HTMLInputElement;
        if (input) input.value = "";
        // setTimeout(() => setProgress(0), 1000);
      }
    } catch {
      clearInterval(interval);
      setResult({
        success: false,
        imported: 0,
        errors: 0,
        total: 0,
        message: "Network error - please try again",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const res = await fetch("/api/health-scores/recalculate", {
        method: "POST",
      });
      const data = await res.json();
      setRecalcResult(data);
    } catch {
      setRecalcResult({
        success: false,
        error: "Network error — please try again.",
      });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Data</h1>
        <p className="text-muted-foreground">
          Upload CSVs to populate your customer database. Import customer
          profiles first, then transaction history for accurate health scores.
        </p>
      </div>

      {/* Import type notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
        <p className="font-medium text-primary mb-1">Import order matters</p>
        <p className="text-muted-foreground">
          Start with <strong>Customer Profiles</strong> to create your customer
          records, then import <strong>Transaction History</strong> using the
          same email addresses. Health scores are calculated automatically after
          each transaction import.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-4">
        {(["customers", "transactions"] as ImportType[]).map((tab) => {
          const TabIcon = IMPORT_CONFIG[tab].icon;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {IMPORT_CONFIG[tab].label}
            </button>
          );
        })}
      </div>

      {/* Upload Area */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{config.label}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {config.description}
          </p>

          <UploadZone
            file={file}
            onFile={setFile}
            uploading={uploading}
            dragActive={dragActive}
            onDrag={handleDrag}
            onDrop={handleDrop}
          />
        </div>

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Processing... {progress}%
            </p>
          </div>
        )}

        {result && (
          <div
            className={`rounded-lg p-4 space-y-2 ${
              result.success
                ? "bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900"
                : "bg-destructive/5 border border-destructive/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              )}
              <p className="font-semibold text-sm">
                {result.success ? "Import complete" : "Import failed"}
              </p>
            </div>

            {result.success && (
              <div className="text-sm text-muted-foreground space-y-1 pl-7">
                <p>✓ {result.imported} rows imported successfully</p>
                {result.errors > 0 && (
                  <p className="text-amber-600">
                    ⚠ {result.errors} rows skipped due to errors
                  </p>
                )}
                {result.message && (
                  <p className="text-primary">{result.message}</p>
                )}
              </div>
            )}

            {result.error_sample && result.error_sample.length > 0 && (
              <div className="pl-7 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Row errors:
                </p>
                {result.error_sample.map((e, i) => (
                  <p key={i} className="text-xs text-destructive">
                    Row {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}

            {!result.success && result.message && (
              <p className="text-sm text-destructive pl-7">{result.message}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {file && (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                {uploading ? "Uploading..." : "Upload and Import"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-muted transition"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </form>

      {/* ── Health Score Recalculation ────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Recalculate Health Scores
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Run this after importing transaction data, or any time you want
            scores to reflect the latest customer activity. All customers in
            your account are updated at once.
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted disabled:opacity-50 transition"
        >
          <RefreshCw
            className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`}
          />
          {recalculating ? "Recalculating..." : "Recalculate now"}
        </button>

        {/* Recalc result */}
        {recalcResult && (
          <div
            className={`rounded-lg p-3 flex items-start gap-2 text-sm ${
              recalcResult.success
                ? "bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900"
                : "bg-destructive/5 border border-destructive/20"
            }`}
          >
            {recalcResult.success ? (
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            )}
            <div>
              {recalcResult.success ? (
                <p className="text-green-700 dark:text-green-400 font-medium">
                  Health scores updated for {recalcResult.updated} customers.{" "}
                  <a
                    href="/dashboard/customers"
                    className="underline hover:no-underline"
                  >
                    View customers →
                  </a>
                </p>
              ) : (
                <p className="text-destructive">
                  {recalcResult.error ??
                    "Recalculation failed. Please try again."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Format requirements */}
      <div className="bg-muted rounded-lg p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          {config.label} — CSV Format
        </h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <span className="font-medium text-foreground">
              Required columns:
            </span>{" "}
            {config.requiredColumns.map((c) => (
              <code
                key={c}
                className="bg-background px-1.5 py-0.5 rounded text-xs mx-0.5"
              >
                {c}
              </code>
            ))}
          </p>
          <p>
            <span className="font-medium text-foreground">
              Optional columns:
            </span>{" "}
            {config.optionalColumns.map((c) => (
              <code
                key={c}
                className="bg-background px-1.5 py-0.5 rounded text-xs mx-0.5"
              >
                {c}
              </code>
            ))}
          </p>
          {config.validStatuses.length > 0 && (
            <p>
              <span className="font-medium text-foreground">
                Valid status values:
              </span>{" "}
              {config.validStatuses.map((s) => (
                <code
                  key={s}
                  className="bg-background px-1.5 py-0.5 rounded text-xs mx-0.5"
                >
                  {s}
                </code>
              ))}
            </p>
          )}
          {config.validStages.length > 0 && (
            <p>
              <span className="font-medium text-foreground">
                Valid lifecycle_stage values:
              </span>{" "}
              {config.validStages.map((s) => (
                <code
                  key={s}
                  className="bg-background px-1.5 py-0.5 rounded text-xs mx-0.5"
                >
                  {s}
                </code>
              ))}
            </p>
          )}
          <p className="pt-1">Maximum 50,000 rows · 10 MB file size limit</p>
          {activeTab === "transactions" && (
            <p className="text-amber-600 font-medium">
              ⚠ Customer profiles must be imported before their transactions —
              the email must already exist in your customer list.
            </p>
          )}
        </div>
      </div>

      {/* Example CSV */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-3">
        <h3 className="font-semibold">Example CSV — {config.label}</h3>
        <pre className="bg-muted rounded p-4 overflow-x-auto text-xs font-mono leading-relaxed">
          {config.exampleCsv}
        </pre>
      </div>
    </div>
  );
}
