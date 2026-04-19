"use server";

import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS = {
  lose_weight: -500,
  maintain: 0,
  gain_muscle: 300,
};

export async function saveProfile(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const gender = formData.get("gender") as "male" | "female" | "other";
  const age = Number(formData.get("age"));
  const height = Number(formData.get("height"));
  const weight = Number(formData.get("weight"));
  const goalType = formData.get("goalType") as
    | "lose_weight"
    | "maintain"
    | "gain_muscle";
  const activityLevel = formData.get(
    "activityLevel",
  ) as keyof typeof ACTIVITY_MULTIPLIERS;

  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  const calorieTarget = tdee + GOAL_ADJUSTMENTS[goalType];
  const proteinTarget = Math.round(weight * 2);
  const fatTarget = Math.round((calorieTarget * 0.25) / 9);
  const carbsTarget = Math.round(
    (calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4,
  );

  await db.insert(userProfiles).values({
    userId: user.id,
    gender,
    age,
    height: String(height),
    weight: String(weight),
    goalType,
    activityLevel,
    calorieTarget,
    proteinTarget,
    fatTarget,
    carbsTarget,
  });

  redirect("/");
}
