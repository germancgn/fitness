"use client";

import type { FoodItem } from "@/app/actions/food";
import AddFoodSheet from "@/components/AddFoodSheet";
import FoodScanner from "@/components/FoodScanner";
import RecentFoodsSheet from "@/components/RecentFoodsSheet";
import { useState } from "react";

type Mode = null | "scan" | "recent";

export default function NutritionControls({
  recentFoods,
  date,
}: {
  recentFoods: FoodItem[];
  date: string;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  function handleFood(food: FoodItem) {
    setMode(null);
    setSelectedFood(food);
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode("recent")}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-3 text-sm transition-colors"
        >
          Add nutrition
        </button>
        <button
          type="button"
          onClick={() => setMode("scan")}
          className="border border-zinc-800 text-white font-medium rounded-lg px-4 py-3 text-sm hover:bg-zinc-950 hover:border-zinc-700 transition-colors"
        >
          Scan
        </button>
      </div>

      {mode === "recent" && (
        <RecentFoodsSheet
          foods={recentFoods}
          onSelect={handleFood}
          onClose={() => setMode(null)}
        />
      )}

      {mode === "scan" && (
        <FoodScanner onFood={handleFood} onClose={() => setMode(null)} />
      )}

      {selectedFood && (
        <AddFoodSheet
          food={selectedFood}
          date={date}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </>
  );
}
