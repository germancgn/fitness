"use server";

import { db } from "@/db";
import { foodItems, foodLogs } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export type FoodItem = {
  id: number;
  name: string;
  calories: string | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  imageFrontUrl: string | null;
  servingSize: string | null;
  servingQuantity: string | null;
};

export async function lookupFood(barcode: string): Promise<FoodItem | null> {
  const cached = await db.query.foodItems.findFirst({
    where: eq(foodItems.barcode, barcode),
  });
  if (cached) return cached;

  const res = await fetch(
    `https://de.openfoodfacts.org/api/v0/product/${barcode}.json`,
  );
  const data = await res.json();
  if (data.status !== 1) return null;

  const p = data.product;
  const n = (p.nutriments ?? {}) as Record<string, string | number | undefined>;
  const num = (v: string | number | undefined) =>
    v != null && v !== "" ? String(v) : null;

  const [item] = await db
    .insert(foodItems)
    .values({
      barcode,
      offId: p._id ?? null,
      name: p.product_name || "Unknown product",
      genericName: p.generic_name ?? null,
      brands: p.brands ?? null,
      quantity: p.quantity ?? null,
      categories: p.categories ?? null,
      servingSize: p.serving_size ?? null,
      servingQuantity:
        p.serving_quantity != null ? String(p.serving_quantity) : null,
      calories: num(n["energy-kcal_100g"] ?? n["energy-kcal"]),
      energyKj: num(n["energy-kj_100g"]),
      fat: num(n.fat_100g),
      saturatedFat: num(n["saturated-fat_100g"]),
      carbs: num(n.carbohydrates_100g),
      sugars: num(n.sugars_100g),
      addedSugars: num(n["added-sugars_100g"]),
      fiber: num(n.fiber_100g),
      protein: num(n.proteins_100g),
      salt: num(n.salt_100g),
      sodium: num(n.sodium_100g),
      ingredientsText: p.ingredients_text ?? null,
      allergens: p.allergens ?? null,
      nutriscoreGrade: ["a", "b", "c", "d", "e"].includes(p.nutriscore_grade)
        ? p.nutriscore_grade
        : null,
      ecoscoreGrade: ["a", "b", "c", "d", "e"].includes(p.ecoscore_grade)
        ? p.ecoscore_grade
        : null,
      imageFrontUrl: p.image_front_url ?? null,
      imageIngredientsUrl: p.image_ingredients_url ?? null,
      imageNutritionUrl: p.image_nutrition_url ?? null,
    })
    .returning();

  return item;
}

export type SearchResult = FoodItem & { offBarcode: string };

export async function searchFood(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set(
    "fields",
    "id,product_name,brands,nutriments,image_front_url,serving_size,serving_quantity",
  );

  const res = await fetch(url.toString());
  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }

  return ((data.products as Record<string, unknown>[]) ?? [])
    .filter((p: Record<string, unknown>) => p.product_name && p.id)
    .map((p: Record<string, unknown>) => {
      const n =
        (p.nutriments as Record<string, string | number | undefined>) ?? {};
      return {
        id: 0,
        offBarcode: String(p.id),
        name: String(p.product_name),
        calories:
          n["energy-kcal_100g"] != null ? String(n["energy-kcal_100g"]) : null,
        protein: n.proteins_100g != null ? String(n.proteins_100g) : null,
        carbs:
          n.carbohydrates_100g != null ? String(n.carbohydrates_100g) : null,
        fat: n.fat_100g != null ? String(n.fat_100g) : null,
        imageFrontUrl: (p.image_front_url as string) ?? null,
        servingSize: (p.serving_size as string) ?? null,
        servingQuantity:
          p.serving_quantity != null ? String(p.serving_quantity) : null,
      };
    });
}

export async function createCustomFood(formData: FormData): Promise<FoodItem> {
  const [item] = await db
    .insert(foodItems)
    .values({
      name: formData.get("name") as string,
      calories: formData.get("calories") as string,
      protein: formData.get("protein") as string,
      carbs: formData.get("carbs") as string,
      fat: formData.get("fat") as string,
    })
    .returning();
  return item;
}

export async function updateFoodLog(logId: number, quantity: number) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await db
    .update(foodLogs)
    .set({ quantity: String(quantity) })
    .where(and(eq(foodLogs.id, logId), eq(foodLogs.userId, user.id)));

  revalidatePath("/");
}

export async function deleteFoodLog(logId: number) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await db
    .delete(foodLogs)
    .where(and(eq(foodLogs.id, logId), eq(foodLogs.userId, user.id)));

  revalidatePath("/");
}

export async function addFoodLog(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const foodItemId = Number(formData.get("foodItemId"));
  const quantity = formData.get("quantity") as string;
  const mealType = formData.get("mealType") as
    | "breakfast"
    | "lunch"
    | "dinner"
    | "snack";
  const today = new Date().toISOString().split("T")[0];
  const dateParam = formData.get("date") as string | null;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam <= today
      ? dateParam
      : today;

  await db.insert(foodLogs).values({
    userId: user.id,
    foodItemId,
    date,
    mealType,
    quantity,
  });

  revalidatePath("/");
}
