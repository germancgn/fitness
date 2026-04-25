import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose weight",
  maintain: "Maintain weight",
  gain_muscle: "Gain muscle",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Active",
  very_active: "Very active",
};

function bmi(weight: string | null, height: string | null): string | null {
  const w = Number(weight);
  const h = Number(height) / 100;
  if (!w || !h) return null;
  return (w / (h * h)).toFixed(1);
}

function bmiCategory(bmiVal: string | null): string {
  const v = Number(bmiVal);
  if (!v) return "";
  if (v < 18.5) return "Underweight";
  if (v < 25) return "Normal";
  if (v < 30) return "Overweight";
  return "Obese";
}

function tdee(
  weight: string | null,
  height: string | null,
  age: number | null,
  gender: string | null,
  activity: string | null,
): number | null {
  const w = Number(weight);
  const h = Number(height);
  if (!w || !h || !age || !gender) return null;

  const bmr =
    gender === "male"
      ? 10 * w + 6.25 * h - 5 * age + 5
      : 10 * w + 6.25 * h - 5 * age - 161;

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * (multipliers[activity ?? "sedentary"] ?? 1.2));
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-900">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-white">{value ?? "—"}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-xs text-zinc-600 uppercase tracking-wide mb-1">
        {title}
      </p>
      <div className="rounded-xl border border-zinc-900 bg-zinc-950 px-4 divide-y divide-zinc-900">
        {children}
      </div>
    </div>
  );
}

export default async function Profile() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const user = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, authUser.id),
  });

  if (!user) {
    return (
      <div className="flex flex-col bg-black min-h-screen font-sans">
        <main className="flex flex-col gap-6 p-6 max-w-lg mx-auto w-full">
          <p className="text-zinc-500 text-sm">No profile set up yet.</p>
        </main>
      </div>
    );
  }

  const bmiVal = bmi(user.weight, user.height);
  const tdeeVal = tdee(
    user.weight,
    user.height,
    user.age,
    user.gender,
    user.activityLevel,
  );

  return (
    <div className="flex flex-col bg-black min-h-screen font-sans">
      <main className="flex flex-col gap-6 p-6 max-w-lg mx-auto w-full pb-8">
        <h1 className="text-white font-semibold text-lg">Profile</h1>

        <Section title="Personal">
          <Row label="Age" value={user.age ? `${user.age} years` : null} />
          <Row
            label="Gender"
            value={
              user.gender
                ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
                : null
            }
          />
          <Row
            label="Height"
            value={user.height ? `${user.height} cm` : null}
          />
          <Row
            label="Weight"
            value={user.weight ? `${user.weight} kg` : null}
          />
        </Section>

        <Section title="Goal & activity">
          <Row
            label="Goal"
            value={user.goalType ? GOAL_LABELS[user.goalType] : null}
          />
          <Row
            label="Activity level"
            value={
              user.activityLevel ? ACTIVITY_LABELS[user.activityLevel] : null
            }
          />
        </Section>

        <Section title="Daily targets">
          <Row
            label="Calories"
            value={user.calorieTarget ? `${user.calorieTarget} kcal` : null}
          />
          <Row
            label="Protein"
            value={user.proteinTarget ? `${user.proteinTarget} g` : null}
          />
          <Row
            label="Carbs"
            value={user.carbsTarget ? `${user.carbsTarget} g` : null}
          />
          <Row
            label="Fat"
            value={user.fatTarget ? `${user.fatTarget} g` : null}
          />
        </Section>

        <Section title="Calculated">
          <Row
            label="BMI"
            value={bmiVal ? `${bmiVal} — ${bmiCategory(bmiVal)}` : null}
          />
          <Row label="TDEE" value={tdeeVal ? `${tdeeVal} kcal/day` : null} />
        </Section>
      </main>
    </div>
  );
}
