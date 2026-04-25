"use server";

import { db } from "@/db";
import { weightLogs } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function logWeight(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const weight = Number(formData.get("weight"));
  const date = String(formData.get("date") ?? "");

  if (!weight || weight < 20 || weight > 500) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  await db.insert(weightLogs).values({
    userId: user.id,
    weight: String(weight),
    date,
  });

  revalidatePath("/profile");
}
