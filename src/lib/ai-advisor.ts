// AI Transit Intelligence Advisor (Groq-powered Low Latency Inference)
// Grounded strictly in Pareto optimization results and physical platform geometry.
// Follows Waseda HCI & Software Dependability principles:
// 1. Evidence-based explanation (not hallucinated).
// 2. Explains the multi-objective tradeoff (crowding vs walking distance).
// 3. Low latency (<300ms) commuter copilot.

export interface CommuterContext {
  stationName: string;
  stationNameJa?: string;
  railwayName: string;
  railwayNameJa?: string;
  carCount: number;
  recommendedCar: number;
  recommendedDoor: number;
  crowdingPercentage: number;
  walkingDistanceMeters: number;
  walkingTimeSeconds: number;
  transferTarget?: {
    name: string;
    nameJa?: string;
    type: string;
    connectsTo?: string;
  } | null;
  serviceStatus: string;
  serviceAlertText?: string;
  userPriority: "speed" | "comfort" | "balanced";
  alternativesSummary?: Array<{
    carNumber: number;
    crowding: number;
    walkDistance: number;
    profile: string;
  }>;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "qwen/qwen3.8-27b";
const FALLBACK_MODEL = "openai/gpt-oss-120b";

async function callGroq(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  maxTokens: number = 250
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in environment");
  }

  const payload = {
    messages,
    max_tokens: maxTokens,
    temperature: 0.3, // Low temperature for deterministic, fact-grounded transit guidance
  };

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, model: PRIMARY_MODEL }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      // Fallback model if primary has temporary rate limit or quota
      const fallbackRes = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...payload, model: FALLBACK_MODEL }),
      });
      if (!fallbackRes.ok) {
        throw new Error(`Groq API error: ${fallbackRes.status}`);
      }
      const data = await fallbackRes.json();
      return data.choices?.[0]?.message?.content || "";
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("AI Advisor error:", err);
    throw err;
  }
}

/**
 * Generate a sharp, tactical commuter rationale for the recommended car/door.
 */
export async function generateBoardingRationale(
  context: CommuterContext
): Promise<{
  headline: string;
  rationale: string;
  rationaleJa: string;
  tacticalTip: string;
}> {
  const systemPrompt = `You are Yutori AI (ゆとり車両アシスタント), an elite Tokyo subway mobility advisor grounded in spatial graph mathematics and Pareto optimization.
Your role is to produce a concise, professional tactical boarding rationale based STRICTLY on real metrics provided.
DO NOT hallucinate station features not present in the data.
DO NOT use vague corporate filler. Speak like an expert Tokyo commuter engineer.

Return a valid JSON object with EXACTLY these four keys:
- "headline": Ultra-punchy 4-7 word executive summary (e.g., "Car 4 Door 2: Direct Escalator Egress")
- "rationale": 2-sentence English explanation of the trade-off (comfort vs. walking distance) and why this candidate dominates.
- "rationaleJa": Professional, natural Japanese summary for Tokyo commuters (Keigo/丁寧語, e.g. "4号車2番ドアは...").
- "tacticalTip": 1 actionable commuter pro-tip (e.g., luggage handling, corridor flow, platform waiting position).`;

  const userPrompt = `Transit Context:
- Station: ${context.stationName} (${context.stationNameJa || ""})
- Railway Line: ${context.railwayName} (${context.railwayNameJa || ""})
- Total Cars on Train: ${context.carCount}
- Chosen Optimal: Car ${context.recommendedCar}, Door ${context.recommendedDoor}
- Crowding: ${context.crowdingPercentage}% capacity
- Walking Distance to Egress: ${context.walkingDistanceMeters}m (~${context.walkingTimeSeconds}s walk)
- Target Egress/Transfer: ${context.transferTarget ? `${context.transferTarget.name} (${context.transferTarget.type})` : "General Exit"}
- Line Service Status: ${context.serviceStatus} ${context.serviceAlertText ? `(${context.serviceAlertText})` : ""}
- User Priority Mode: ${context.userPriority}
- Alternatives available: ${JSON.stringify(context.alternativesSummary || [])}

Generate the JSON response.`;

  try {
    const raw = await callGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], 300);

    // Clean JSON markdown if wrapped in ```json
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      headline: parsed.headline || `Car ${context.recommendedCar} Boarding Strategy`,
      rationale: parsed.rationale || `Optimized for ${context.userPriority} with ${context.crowdingPercentage}% load and ${context.walkingDistanceMeters}m walk.`,
      rationaleJa: parsed.rationaleJa || `${context.recommendedCar}号車のご利用が快適性と乗り換えのバランスに最も優れています。`,
      tacticalTip: parsed.tacticalTip || "Board at the marked door positions for faster boarding.",
    };
  } catch (e) {
    // Graceful fallback if AI is offline
    return {
      headline: `Car ${context.recommendedCar}: Pareto Optimal Door`,
      rationale: `Positions you within ${context.walkingDistanceMeters}m of ${context.transferTarget?.name || "your exit"} while maintaining ${context.crowdingPercentage}% passenger load.`,
      rationaleJa: `${context.recommendedCar}号車は混雑率${context.crowdingPercentage}%で、${context.transferTarget?.name || "改札/乗換"}まで約${context.walkingDistanceMeters}mの最適位置です。`,
      tacticalTip: "Align with the floor markings before train arrival to secure seamless boarding.",
    };
  }
}

/**
 * Handle interactive commuter queries about the current train/station.
 */
export async function answerCommuterQuery(
  context: CommuterContext,
  userQuestion: string
): Promise<string> {
  const systemPrompt = `You are Yutori AI (ゆとり案内), an expert Tokyo transit copilot assisting a commuter standing on the platform.
You have exact telemetry and platform layout data.
Answer the user's question directly, accurately, and concisely in 2-4 sentences.
Always maintain high technical accuracy regarding Tokyo train customs (mild A/C cars, luggage placement, transfer bottlenecking, platform doors).
If the user asks in Japanese, answer in Japanese. If English, answer in English.`;

  const userPrompt = `Current Train & Platform State:
- Station: ${context.stationName} (${context.stationNameJa || ""})
- Line: ${context.railwayName}
- Train composition: ${context.carCount} cars
- Recommended: Car ${context.recommendedCar}, Door ${context.recommendedDoor}
- Crowding: ${context.crowdingPercentage}%
- Egress Target: ${context.transferTarget ? context.transferTarget.name : "None specified"}
- Service Status: ${context.serviceStatus}

User Question: "${userQuestion}"`;

  return await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], 200);
}
