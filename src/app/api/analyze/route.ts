import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { foodItems, foodLogs, userProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

const client = new Anthropic();

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { date } = (await req.json()) as { date: string };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("Invalid date", { status: 400 });
  }

  const [profile, logs] = await Promise.all([
    db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    }),
    db
      .select({
        mealType: foodLogs.mealType,
        quantity: foodLogs.quantity,
        name: foodItems.name,
        calories: foodItems.calories,
        protein: foodItems.protein,
        carbs: foodItems.carbs,
        fat: foodItems.fat,
      })
      .from(foodLogs)
      .innerJoin(foodItems, eq(foodLogs.foodItemId, foodItems.id))
      .where(and(eq(foodLogs.userId, user.id), eq(foodLogs.date, date))),
  ]);

  const totals = logs.reduce(
    (acc, row) => {
      const qty = Number(row.quantity) / 100;
      return {
        calories: acc.calories + (Number(row.calories) || 0) * qty,
        protein: acc.protein + (Number(row.protein) || 0) * qty,
        carbs: acc.carbs + (Number(row.carbs) || 0) * qty,
        fat: acc.fat + (Number(row.fat) || 0) * qty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const mealGroups = logs.reduce<Record<string, string[]>>((acc, row) => {
    const type = row.mealType ?? "snack";
    const qty = Number(row.quantity) / 100;
    const kcal = Math.round((Number(row.calories) || 0) * qty);
    if (!acc[type]) acc[type] = [];
    acc[type].push(`${row.name} (${row.quantity}g, ${kcal} kcal)`);
    return acc;
  }, {});

  const mealSummary = Object.entries(mealGroups)
    .map(([type, items]) => `${type}: ${items.join(", ")}`)
    .join("\n");

  const goalLabels: Record<string, string> = {
    lose_weight: "lose weight",
    maintain: "maintain weight",
    gain_muscle: "gain muscle",
  };

  const userContext = profile
    ? `Goal: ${goalLabels[profile.goalType ?? "maintain"] ?? profile.goalType}
Targets: ${profile.calorieTarget} kcal, ${profile.proteinTarget}g protein, ${profile.carbsTarget}g carbs, ${profile.fatTarget}g fat`
    : "No profile set — use general healthy eating guidelines.";

  const prompt = `You are a concise nutrition coach. Analyze this user's food log for ${date} and give actionable feedback.

User profile:
${userContext}

What they ate today:
${mealSummary || "Nothing logged yet."}

Totals: ${Math.round(totals.calories)} kcal | ${Math.round(totals.protein)}g protein | ${Math.round(totals.carbs)}g carbs | ${Math.round(totals.fat)}g fat

Give a brief, structured analysis covering:
1. How today's intake compares to their targets
2. What they did well
3. 1-2 specific improvements for tomorrow

Keep it friendly, practical, and under 200 words. Use plain text — no markdown headers or bullet symbols, just clean paragraphs.`;

  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
    thinking: { type: "disabled" },
    system:
      "You are a concise, encouraging nutrition coach. Be direct and practical. No fluff.",
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
