import { NextRequest, NextResponse } from "next/server";
import {
  generateBoardingRationale,
  answerCommuterQuery,
  type CommuterContext,
} from "@/lib/ai-advisor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, context, question } = body;

    if (!context) {
      return NextResponse.json(
        { error: "Missing commuter context" },
        { status: 400 }
      );
    }

    if (action === "query") {
      if (!question || typeof question !== "string") {
        return NextResponse.json(
          { error: "Missing question for query action" },
          { status: 400 }
        );
      }
      const answer = await answerCommuterQuery(context as CommuterContext, question);
      return NextResponse.json({ answer });
    }

    // Default action: "rationale"
    const rationale = await generateBoardingRationale(context as CommuterContext);
    return NextResponse.json(rationale);
  } catch (error) {
    console.error("AI Advisor API Route error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI transit advice" },
      { status: 500 }
    );
  }
}
