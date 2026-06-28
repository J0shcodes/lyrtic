"use client";

import { useState } from "react";
import { Brain, Zap, MessageSquare } from "lucide-react";

export default function InsightsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<
    Array<{ title: string; content: string }>
  >([]);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/insights/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setInsights([
          ...insights,
          { title: "AI Response", content: data.answer },
        ]);
      }
    } catch (error) {
      console.error("AI query error:", error);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Insights</h1>
        <p className="text-muted-foreground">
          Ask AI questions about your customers and get actionable insights
        </p>
      </div>

      {/* AI Query */}
      <form
        onSubmit={handleAskAI}
        className="bg-card border border-border rounded-lg p-6 space-y-4"
      >
        <label className="block">
          <span className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Ask Lyrtic About Your Customers
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Which customers have the highest churn risk? What's the trend in customer health scores?"
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={loading}
          />
        </label>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
        >
          <Zap className="w-4 h-4" />
          {loading ? "Analyzing..." : "Get Insight"}
        </button>
      </form>

      {/* Insights List */}
      {insights.length === 0 && !loading && (
        <div className="border border-border rounded-lg p-12 text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-xl font-semibold">No insights yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ask Lyrtic questions about your customers to get AI-powered insights
            about churn risk, health scores, and more.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-6 space-y-2"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              {insight.title}
            </h3>
            <p className="text-muted-foreground">{insight.content}</p>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          "What are the top reasons customers churn?",
          "Which customer segments have the best health scores?",
          "What actions should I take to reduce churn?",
          "Which customers should I prioritize for retention?",
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => setQuery(prompt)}
            className="text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition"
          >
            <p className="text-sm font-medium">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
