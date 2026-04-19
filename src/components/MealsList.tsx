"use client";

import EditFoodLogSheet from "@/components/EditFoodLogSheet";
import { useState } from "react";

type LogEntry = {
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
};

export default function MealsList({
  meals,
  mealOrder,
  mealLabels,
}: {
  meals: Record<string, LogEntry[]>;
  mealOrder: string[];
  mealLabels: Record<string, string>;
}) {
  const [editing, setEditing] = useState<LogEntry | null>(null);

  return (
    <>
      <div className="flex flex-col gap-4">
        {mealOrder.map((type) => {
          const items = meals[type];
          if (!items?.length) return null;
          return (
            <div key={type} className="flex flex-col gap-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">
                {mealLabels[type]}
              </p>
              <div className="flex flex-col divide-y divide-zinc-900">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEditing(item)}
                    className="flex items-center justify-between py-2.5 text-left hover:bg-zinc-900 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <p className="text-sm text-white truncate flex-1 mr-4">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-zinc-500">
                        {item.quantity}g
                      </span>
                      <span className="text-sm text-zinc-300">
                        {item.calories} kcal
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <EditFoodLogSheet entry={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
