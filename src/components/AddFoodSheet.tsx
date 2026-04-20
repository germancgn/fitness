"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FoodItem } from "@/app/actions/food";
import { addFoodLog } from "@/app/actions/food";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
] as const;

export default function AddFoodSheet({
  food,
  date,
  onClose,
}: {
  food: FoodItem;
  date: string;
  onClose: () => void;
}) {
  const hasServing = !!food.servingQuantity && Number(food.servingQuantity) > 0;
  const [mode, setMode] = useState<"servings" | "grams">(
    hasServing ? "servings" : "grams",
  );
  const [servings, setServings] = useState("1");
  const [grams, setGrams] = useState("100");
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("lunch");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const gramsValue =
    mode === "servings"
      ? (Number(servings) || 0) * Number(food.servingQuantity)
      : Number(grams) || 0;

  const factor = gramsValue / 100;
  const calories = Math.round((Number(food.calories) || 0) * factor);
  const protein = ((Number(food.protein) || 0) * factor).toFixed(1);
  const carbs = ((Number(food.carbs) || 0) * factor).toFixed(1);
  const fat = ((Number(food.fat) || 0) * factor).toFixed(1);

  async function handleSubmit(formData: FormData) {
    formData.set("quantity", String(gramsValue));
    setLoading(true);
    await addFoodLog(formData);
    setLoading(false);
    router.refresh();
    onClose();
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl p-6 flex flex-col gap-5 max-w-lg mx-auto">
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto -mt-2" />

        <div className="flex items-center justify-between">
          <p className="text-white font-medium">Add food</p>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        </div>

        <div className="flex gap-4 items-start">
          {food.imageFrontUrl && (
            <div className="relative w-16 h-16 shrink-0">
              <Image
                src={food.imageFrontUrl}
                alt={food.name}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <p className="text-white font-medium leading-snug">{food.name}</p>
            <p className="text-xs text-zinc-500">
              {calories} kcal · {protein}g protein · {carbs}g carbs · {fat}g fat
            </p>
          </div>
        </div>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="foodItemId" value={food.id} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="mealType" value={mealType} />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">
                Quantity
              </span>
              {hasServing && (
                <div className="flex gap-1 bg-zinc-900 rounded-md p-0.5">
                  <button
                    type="button"
                    onClick={() => setMode("servings")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      mode === "servings"
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Servings
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("grams")}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      mode === "grams"
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Grams
                  </button>
                </div>
              )}
            </div>

            {mode === "servings" ? (
              <div className="flex flex-col gap-1">
                <div className="relative">
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    min="1"
                    step="1"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors pr-24"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 truncate max-w-20 text-right">
                    {food.servingSize ?? `×${food.servingQuantity}g`}
                  </span>
                </div>
                <p className="text-xs text-zinc-600">
                  = {Math.round(gramsValue)}g
                </p>
              </div>
            ) : (
              <div className="relative">
                <input
                  name="quantity"
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  min="1"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  g
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">
              Meal
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMealType(m.value)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                    mealType === m.value
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || gramsValue <= 0}
            className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-40"
          >
            {loading ? "Adding…" : `Add ${calories} kcal`}
          </button>
        </form>
      </div>
    </>
  );
}
