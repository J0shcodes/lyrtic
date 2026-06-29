import { NextResponse, NextRequest } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        answer: `This is a demo response to your 
        query: "${query}". In production, this 
        would be powered by Claude AI to provide 
        real insights about your customers.`,
      });
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a customer 
                intelligence AI assistant. Answer this 
                question about customer data and 
                business insights: ${query}. 
                Provide a concise, actionable response.`,
        },
      ],
    });

    const answer =
      message.content[0].type === "text"
        ? message.content[0].text
        : "Unable to generate insight";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 },
    );
  }
}
