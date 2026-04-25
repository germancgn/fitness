import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { signOut } from "@/app/actions/auth";
import DayNav from "@/components/DayNav";
import MacroCards from "@/components/MacroCards";
import MealsList from "@/components/MealsList";
import NutritionAnalysis from "@/components/NutritionAnalysis";
import NutritionControls from "@/components/NutritionControls";
import TodayRedirect from "@/components/TodayRedirect";
import { db } from "@/db";
import { foodItems, foodLogs, userProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

async function getPageData(userId: string, date: string) {
  const foodLogColumns = {
    id: foodLogs.id,
    userId: foodLogs.userId,
    foodItemId: foodLogs.foodItemId,
    date: foodLogs.date,
    mealType: foodLogs.mealType,
    quantity: foodLogs.quantity,
    createdAt: foodLogs.createdAt,
  };

  const foodItemColumns = {
    id: foodItems.id,
    name: foodItems.name,
    calories: foodItems.calories,
    protein: foodItems.protein,
    carbs: foodItems.carbs,
    fat: foodItems.fat,
    imageFrontUrl: foodItems.imageFrontUrl,
    servingSize: foodItems.servingSize,
    servingQuantity: foodItems.servingQuantity,
  };

  const recentSubquery = db
    .select({
      foodItemId: foodLogs.foodItemId,
      lastLogged: sql<string>`max(${foodLogs.createdAt})`.as("last_logged"),
    })
    .from(foodLogs)
    .where(eq(foodLogs.userId, userId))
    .groupBy(foodLogs.foodItemId)
    .orderBy(sql`max(${foodLogs.createdAt}) desc`)
    .limit(20)
    .as("recent");

  const [profile, logs, recentFoods] = await Promise.all([
    db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) }),
    db
      .select({ food_logs: foodLogColumns, food_items: foodItemColumns })
      .from(foodLogs)
      .innerJoin(foodItems, eq(foodLogs.foodItemId, foodItems.id))
      .where(and(eq(foodLogs.userId, userId), eq(foodLogs.date, date)))
      .orderBy(foodLogs.createdAt),
    db
      .select(foodItemColumns)
      .from(foodItems)
      .innerJoin(recentSubquery, eq(foodItems.id, recentSubquery.foodItemId))
      .orderBy(sql`${recentSubquery.lastLogged} desc`),
  ]);

  const totals = logs.reduce(
    (acc, { food_logs: log, food_items: item }) => {
      const qty = Number(log.quantity) / 100;
      return {
        calories: acc.calories + (Number(item.calories) || 0) * qty,
        protein: acc.protein + (Number(item.protein) || 0) * qty,
        carbs: acc.carbs + (Number(item.carbs) || 0) * qty,
        fat: acc.fat + (Number(item.fat) || 0) * qty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const meals = logs.reduce<
    Record<
      string,
      Array<{
        id: number;
        name: string;
        quantity: number;
        calories: number;
        caloriesPer100g: string | null;
        protein: string | null;
        carbs: string | null;
        fat: string | null;
        servingSize: string | null;
        servingQuantity: string | null;
        imageFrontUrl: string | null;
      }>
    >
  >((acc, { food_logs: log, food_items: item }) => {
    const type = log.mealType ?? "snack";
    if (!acc[type]) acc[type] = [];
    const qty = Number(log.quantity) / 100;
    acc[type].push({
      id: log.id,
      name: item.name,
      quantity: Number(log.quantity),
      calories: Math.round((Number(item.calories) || 0) * qty),
      caloriesPer100g: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      servingSize: item.servingSize,
      servingQuantity: item.servingQuantity,
      imageFrontUrl: item.imageFrontUrl,
    });
    return acc;
  }, {});

  const macroEntries = logs.map(({ food_logs: log, food_items: item }) => {
    const qty = Number(log.quantity) / 100;
    return {
      name: item.name,
      protein: Math.round((Number(item.protein) || 0) * qty),
      carbs: Math.round((Number(item.carbs) || 0) * qty),
      fat: Math.round((Number(item.fat) || 0) * qty),
    };
  });

  return {
    totals: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
    },
    targets: {
      calories: profile?.calorieTarget ?? 2000,
      protein: profile?.proteinTarget ?? 150,
      carbs: profile?.carbsTarget ?? 200,
      fat: profile?.fatTarget ?? 65,
    },
    meals,
    recentFoods,
    macroEntries,
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const todayUTC = new Date().toISOString().split("T")[0];
  const tomorrowUTC = new Date(Date.now() + 86400000)
    .toISOString()
    .split("T")[0];
  const { date: dateParam } = await searchParams;
  const isExplicitDate =
    !!dateParam &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateParam) &&
    dateParam <= tomorrowUTC;
  const date = isExplicitDate ? dateParam : todayUTC;

  const { totals, targets, meals, recentFoods, macroEntries } =
    await getPageData(user.id, date);
  const mealOrder = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="flex flex-col bg-black font-sans min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <span className="text-white font-semibold">FitnessLabs</span>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>

      <main className="flex flex-col gap-6 p-6 max-w-lg mx-auto w-full pb-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">
            {date === todayUTC ? "Today" : date}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-white">
              {totals.calories}
            </span>
            <span className="text-zinc-500 text-sm mb-2">
              / {targets.calories} kcal
            </span>
            {totals.calories < targets.calories && (
              <span className="text-zinc-500 text-sm ml-auto">
                {targets.calories - totals.calories} left
              </span>
            )}
          </div>
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{
                width: `${Math.min((totals.calories / targets.calories) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        <MacroCards totals={totals} targets={targets} entries={macroEntries} />

        <NutritionControls recentFoods={recentFoods} date={date} />

        {!isExplicitDate && <TodayRedirect serverDate={todayUTC} />}
        <DayNav date={date} />

        <NutritionAnalysis date={date} />

        <MealsList
          meals={meals}
          mealOrder={mealOrder}
          mealLabels={MEAL_LABELS}
        />
      </main>
    </div>
  );
}
