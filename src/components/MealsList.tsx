"use client";

import { useState } from "react";
import EditFoodLogSheet from "@/components/EditFoodLogSheet";

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

  const hasAnyEntries = mealOrder.some((type) => meals[type]?.length);

  return (
    <>
      <div className="flex flex-col gap-4">
        {!hasAnyEntries && (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <p className="text-zinc-300 font-medium">Nothing logged here</p>
            <p className="text-xs text-zinc-600 max-w-48 leading-relaxed">
              Add food to start tracking your nutrition for this day
            </p>
          </div>
        )}
        {mealOrder.map((type) => {
          const items = meals[type];

          if (!items?.length) return null;

          const mealCalories = items.reduce(
            (sum, item) => sum + item.calories,
            0,
          );

          const macros = items.reduce(
            (sum, item) => {
              const factor = item.quantity / 100;
              return {
                protein: sum.protein + (Number(item.protein) || 0) * factor,
                carbs: sum.carbs + (Number(item.carbs) || 0) * factor,
                fat: sum.fat + (Number(item.fat) || 0) * factor,
              };
            },
            { protein: 0, carbs: 0, fat: 0 },
          );

          const macroKcal = {
            protein: macros.protein * 4,
            carbs: macros.carbs * 4,
            fat: macros.fat * 9,
          };
          const totalMacroKcal =
            macroKcal.protein + macroKcal.carbs + macroKcal.fat;

          return (
            <div key={type} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">
                  {mealLabels[type]}
                </p>
                <p className="text-xs text-zinc-500">{mealCalories} kcal</p>
              </div>
              {totalMacroKcal > 0 && (
                <div className="flex gap-px h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{
                      width: `${(macroKcal.protein / totalMacroKcal) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-yellow-500 h-full"
                    style={{
                      width: `${(macroKcal.carbs / totalMacroKcal) * 100}%`,
                    }}
                  />
                  <div
                    className="bg-orange-500 h-full"
                    style={{
                      width: `${(macroKcal.fat / totalMacroKcal) * 100}%`,
                    }}
                  />
                </div>
              )}
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
