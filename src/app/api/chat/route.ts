import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { anthropic } from "@/lib/anthropic";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { chat } = (await req.json()) as {
    chat: {
      content: string;
      role: "user" | "assistant";
    }[];
  };

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  const goalLabels: Record<string, string> = {
    lose_weight: "lose weight",
    maintain: "maintain weight",
    gain_muscle: "gain muscle",
  };

  const userContext = profile
    ? `User profile:
Goal: ${goalLabels[profile.goalType ?? "maintain"] ?? profile.goalType}
Age: ${profile.age ?? "unknown"}, Gender: ${profile.gender ?? "unknown"}, Height: ${profile.height ? `${profile.height}cm` : "unknown"}, Weight: ${profile.weight ? `${profile.weight}kg` : "unknown"}, Activity: ${profile.activityLevel ?? "unknown"}
Daily targets: ${profile.calorieTarget} kcal, ${profile.proteinTarget}g protein, ${profile.carbsTarget}g carbs, ${profile.fatTarget}g fat`
    : "No user profile set — use general healthy eating guidelines.";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: chat,
    thinking: { type: "disabled" },
    system: `You are a no-nonsense nutrition coach. Be blunt, specific, and actionable. Skip the encouragement padding — the user wants real feedback, not cheerleading. Never use phrases like 'great job', 'good start', 'you've got this'. Speak like a knowledgeable friend, not a wellness app. Respond in plain text only — no markdown, no bullet points, no headers, no bold or italic.

${userContext}`,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
