"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle } from "lucide-react";

export default function ImportPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
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

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        console.log("Import successful:", data);
        setFile(null);
        setTimeout(() => setProgress(0), 1000);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Customer Data</h1>
        <p className="text-muted-foreground">
          Upload a CSV file with your customer data to get started
        </p>
      </div>

      {/* Upload Area */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
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
            onChange={handleChange}
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
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </>
            )}
          </label>
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
              {progress}% uploaded
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {file && (
            <>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                {uploading ? "Uploading..." : "Upload and Import"}
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="flex-1 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-muted transition"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </form>

      {/* Instructions */}
      <div className="bg-muted rounded-lg p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          CSV Format Requirements
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>First row should contain column headers</li>
          <li>Required columns: email, full_name</li>
          <li>
            Optional columns: phone, location, customer_id, status,
            lifecycle_stage
          </li>
          <li>Maximum 50,000 rows per import</li>
          <li>File size limit: 10 MB</li>
        </ul>
      </div>

      {/* Example */}
      <div className="bg-card rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">Example CSV Format</h3>
        <div className="bg-muted rounded p-4 overflow-x-auto text-sm font-mono">
          <pre>{`email,full_name,phone,status
john@acme.com,John Smith,555-0001,active
jane@techstart.com,Jane Doe,555-0002,active
bob@global.com,Bob Johnson,555-0003,inactive`}</pre>
        </div>
      </div>
    </div>
  );
}
