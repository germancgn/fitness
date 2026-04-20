"use server";

import { db } from "@/db";
import { foodItems, mealTemplateItems, mealTemplates } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { foodLogs } from "@/db/schema";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export type TemplateItem = {
  id: number;
  foodItemId: number;
  name: string;
  quantity: number;
  calories: string | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  servingSize: string | null;
  servingQuantity: string | null;
  imageFrontUrl: string | null;
};

export type MealTemplate = {
  id: number;
  name: string;
  totalCalories: number;
  items: TemplateItem[];
};

export async function getMealTemplates(): Promise<MealTemplate[]> {
  const user = await getUser();
  if (!user) return [];

  const rows = await db
    .select({
      templateId: mealTemplates.id,
      templateName: mealTemplates.name,
      itemId: mealTemplateItems.id,
      foodItemId: mealTemplateItems.foodItemId,
      quantity: mealTemplateItems.quantity,
      name: foodItems.name,
      calories: foodItems.calories,
      protein: foodItems.protein,
      carbs: foodItems.carbs,
      fat: foodItems.fat,
      servingSize: foodItems.servingSize,
      servingQuantity: foodItems.servingQuantity,
      imageFrontUrl: foodItems.imageFrontUrl,
    })
    .from(mealTemplates)
    .leftJoin(
      mealTemplateItems,
      eq(mealTemplateItems.mealTemplateId, mealTemplates.id),
    )
    .leftJoin(foodItems, eq(mealTemplateItems.foodItemId, foodItems.id))
    .where(eq(mealTemplates.userId, user.id))
    .orderBy(mealTemplates.createdAt);

  const map = new Map<number, MealTemplate>();
  for (const row of rows) {
    if (!map.has(row.templateId)) {
      map.set(row.templateId, {
        id: row.templateId,
        name: row.templateName,
        totalCalories: 0,
        items: [],
      });
    }
    const template = map.get(row.templateId)!;
    if (row.itemId && row.name) {
      const qty = Number(row.quantity) / 100;
      template.totalCalories += Math.round((Number(row.calories) || 0) * qty);
      template.items.push({
        id: row.itemId,
        foodItemId: row.foodItemId!,
        name: row.name,
        quantity: Number(row.quantity),
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fat: row.fat,
        servingSize: row.servingSize,
        servingQuantity: row.servingQuantity,
        imageFrontUrl: row.imageFrontUrl,
      });
    }
  }

  return Array.from(map.values());
}

export async function createMealTemplate(name: string): Promise<number> {
  const user = await getUser();
  if (!user) throw new Error("Unauthenticated");

  const [template] = await db
    .insert(mealTemplates)
    .values({ userId: user.id, name })
    .returning({ id: mealTemplates.id });

  return template.id;
}

export async function renameMealTemplate(id: number, name: string) {
  const user = await getUser();
  if (!user) return;

  await db
    .update(mealTemplates)
    .set({ name })
    .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, user.id)));
}

export async function deleteMealTemplate(id: number) {
  const user = await getUser();
  if (!user) return;

  await db
    .delete(mealTemplates)
    .where(and(eq(mealTemplates.id, id), eq(mealTemplates.userId, user.id)));
}

export async function addItemToTemplate(
  templateId: number,
  foodItemId: number,
  quantity: number,
) {
  const user = await getUser();
  if (!user) return;

  const [template] = await db
    .select({ id: mealTemplates.id })
    .from(mealTemplates)
    .where(
      and(eq(mealTemplates.id, templateId), eq(mealTemplates.userId, user.id)),
    );
  if (!template) return;

  const [inserted] = await db
    .insert(mealTemplateItems)
    .values({
      mealTemplateId: templateId,
      foodItemId,
      quantity: String(quantity),
    })
    .returning({ id: mealTemplateItems.id });

  return inserted?.id;
}

export async function removeItemFromTemplate(itemId: number) {
  const user = await getUser();
  if (!user) return;

  const [item] = await db
    .select({ mealTemplateId: mealTemplateItems.mealTemplateId })
    .from(mealTemplateItems)
    .where(eq(mealTemplateItems.id, itemId));
  if (!item) return;

  const [template] = await db
    .select({ id: mealTemplates.id })
    .from(mealTemplates)
    .where(
      and(
        eq(mealTemplates.id, item.mealTemplateId),
        eq(mealTemplates.userId, user.id),
      ),
    );
  if (!template) return;

  await db.delete(mealTemplateItems).where(eq(mealTemplateItems.id, itemId));
}

export async function logMealTemplate(
  templateId: number,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
) {
  const user = await getUser();
  if (!user) return;

  const items = await db
    .select({
      foodItemId: mealTemplateItems.foodItemId,
      quantity: mealTemplateItems.quantity,
    })
    .from(mealTemplateItems)
    .innerJoin(
      mealTemplates,
      and(
        eq(mealTemplateItems.mealTemplateId, mealTemplates.id),
        eq(mealTemplates.userId, user.id),
      ),
    )
    .where(eq(mealTemplateItems.mealTemplateId, templateId));

  if (!items.length) return;

  const date = new Date().toISOString().split("T")[0];
  await db.insert(foodLogs).values(
    items.map((item) => ({
      userId: user.id,
      foodItemId: item.foodItemId,
      date,
      mealType,
      quantity: item.quantity,
    })),
  );

  revalidatePath("/");
}
