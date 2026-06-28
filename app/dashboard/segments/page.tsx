"use client";

import { Plus } from "lucide-react";

export default function SegmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer Segments</h1>
          <p className="text-muted-foreground">
            Create and manage customer segments based on behavior and attributes
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
          <Plus className="w-5 h-5" />
          Create Segment
        </button>
      </div>

      <div className="border border-border rounded-lg p-12 text-center space-y-4">
        <div className="text-6xl">📊</div>
        <h3 className="text-xl font-semibold">No segments yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Create your first customer segment to group customers by behavior,
          value, or risk level for targeted campaigns.
        </p>
        <button className="mx-auto flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition">
          <Plus className="w-5 h-5" />
          Create Your First Segment
        </button>
      </div>
    </div>
  );
}
