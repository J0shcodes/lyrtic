"use client";

import { useState } from "react";
import { Brain, Zap, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
          Ask questions about your customers and get actionable answers powered
          by real data.
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

      {/* Quick prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          "Which customers have the highest churn risk right now?",
          "Who are my top 5 customers by lifetime value?",
          "What actions should I take to reduce churn this week?",
          "Which customers haven't transacted recently?",
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => setQuery(prompt)}
            className="text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition text-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {insights.length === 0 && !loading && (
        <div className="border border-border rounded-lg p-12 text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-xl font-semibold">No insights yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Ask a question above or click one of the quick prompts to get
            AI-powered answers about your customer base.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-lg p-6 space-y-3"
          >
            {/* Question as card title */}
            <div className="flex items-start gap-2 pb-3 border-b border-border">
              <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm font-semibold">{insight.title}</p>
            </div>
 
            {/* Rendered markdown */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground
              [&>p]:mb-3 [&>p:last-child]:mb-0 [&>p]:leading-relaxed
              [&>ul]:mb-3 [&>ul]:pl-5 [&>ul>li]:mb-1 [&>ul>li]:list-disc [&>ul>li]:text-sm
              [&>ol]:mb-3 [&>ol]:pl-5 [&>ol>li]:mb-1 [&>ol>li]:list-decimal [&>ol>li]:text-sm
              [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h1]:mt-4
              [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2 [&>h2]:mt-3
              [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-1 [&>h3]:mt-2
              [&>strong]:font-semibold [&>strong]:text-foreground
              [&>em]:italic [&>em]:text-muted-foreground
              [&>blockquote]:border-l-2 [&>blockquote]:border-primary/40 [&>blockquote]:pl-4 [&>blockquote]:text-muted-foreground [&>blockquote]:italic
              [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono
              [&>hr]:border-border [&>hr]:my-3">
              <ReactMarkdown>{insight.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
