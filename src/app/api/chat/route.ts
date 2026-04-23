import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { foodItems, foodLogs, userProfiles } from "@/db/schema";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { chat, date } = (await req.json()) as {
    date: string;
    chat: { content: string; role: "user" | "assistant" }[];
  };

  const [profile, logs] = await Promise.all([
    db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, user.id),
    }),
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? db
          .select({
            mealType: foodLogs.mealType,
            quantity: foodLogs.quantity,
            name: foodItems.name,
            calories: foodItems.calories,
            protein: foodItems.protein,
            carbs: foodItems.carbs,
            fat: foodItems.fat,
            sugars: foodItems.sugars,
          })
          .from(foodLogs)
          .innerJoin(foodItems, eq(foodLogs.foodItemId, foodItems.id))
          .where(and(eq(foodLogs.userId, user.id), eq(foodLogs.date, date)))
      : Promise.resolve([]),
  ]);

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

  const mealGroups = logs.reduce<Record<string, string[]>>((acc, row) => {
    const type = row.mealType ?? "snack";
    const qty = Number(row.quantity) / 100;
    const kcal = Math.round((Number(row.calories) || 0) * qty);
    if (!acc[type]) acc[type] = [];
    const protein = Math.round((Number(row.protein) || 0) * qty);
    const carbs = Math.round((Number(row.carbs) || 0) * qty);
    const fat = Math.round((Number(row.fat) || 0) * qty);
    const sugars = Math.round((Number(row.sugars) || 0) * qty);
    acc[type].push(
      `${row.name} (${row.quantity}g: ${kcal} kcal, ${protein}g protein, ${carbs}g carbs, ${fat}g fat, ${sugars}g sugars)`,
    );
    return acc;
  }, {});

  const totals = logs.reduce(
    (acc, row) => {
      const qty = Number(row.quantity) / 100;
      return {
        calories: acc.calories + (Number(row.calories) || 0) * qty,
        protein: acc.protein + (Number(row.protein) || 0) * qty,
        carbs: acc.carbs + (Number(row.carbs) || 0) * qty,
        fat: acc.fat + (Number(row.fat) || 0) * qty,
        sugars: acc.sugars + (Number(row.sugars) || 0) * qty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugars: 0 },
  );

  const foodContext =
    logs.length > 0
      ? `Food log for ${date}:
${Object.entries(mealGroups)
  .map(([type, items]) => `${type}: ${items.join(", ")}`)
  .join("\n")}
  
<Totals>
${Math.round(totals.calories)} kcal
${Math.round(totals.protein)}g protein
${Math.round(totals.carbs)}g carbs
${Math.round(totals.fat)}g fat
${Math.round(totals.sugars)}g sugars
</Totals>`
      : `No food logged for ${date}.`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: chat,
    thinking: { type: "disabled" },
    system: `You are a no-nonsense nutrition coach. Be blunt, specific, and actionable. Skip the encouragement padding — the user wants real feedback, not cheerleading. Never use phrases like 'great job', 'good start', 'you've got this'. Speak like a knowledgeable friend, not a wellness app. Respond in plain text only — no markdown, no bullet points, no headers, no bold or italic.

    <UserContext>
        ${userContext}
    </UserContext>

    <FoodContext>
        ${foodContext}
    </FoodContext>
`,
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
