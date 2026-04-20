"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteFoodLog, updateFoodLog } from "@/app/actions/food";

type LogEntry = {
  id: number;
  name: string;
  quantity: number;
  caloriesPer100g: string | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  servingSize: string | null;
  servingQuantity: string | null;
};

export default function EditFoodLogSheet({
  entry,
  onClose,
}: {
  entry: LogEntry;
  onClose: () => void;
}) {
  const hasServing =
    !!entry.servingQuantity && Number(entry.servingQuantity) > 0;
  const initialServings = hasServing
    ? String(
        Math.round((entry.quantity / Number(entry.servingQuantity)) * 10) / 10,
      )
    : "1";

  const [mode, setMode] = useState<"servings" | "grams">(
    hasServing ? "servings" : "grams",
  );
  const [servings, setServings] = useState(initialServings);
  const [grams, setGrams] = useState(String(entry.quantity));
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const gramsValue =
    mode === "servings"
      ? (Number(servings) || 0) * Number(entry.servingQuantity)
      : Number(grams) || 0;

  const factor = gramsValue / 100;
  const calories = Math.round((Number(entry.caloriesPer100g) || 0) * factor);
  const protein = ((Number(entry.protein) || 0) * factor).toFixed(1);
  const carbs = ((Number(entry.carbs) || 0) * factor).toFixed(1);
  const fat = ((Number(entry.fat) || 0) * factor).toFixed(1);

  async function handleSave() {
    if (gramsValue <= 0) return;
    setLoading(true);
    await updateFoodLog(entry.id, gramsValue);
    setLoading(false);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    setLoading(true);
    await deleteFoodLog(entry.id);
    setLoading(false);
    router.refresh();
    onClose();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-black/60 z-40 w-full cursor-default"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl p-6 flex flex-col gap-5 max-w-lg mx-auto">
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto -mt-2" />

        <div className="flex items-center justify-between">
          <p className="text-white font-medium truncate flex-1 mr-4">
            {entry.name}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-sm shrink-0"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-zinc-500 -mt-3">
          {calories} kcal · {protein}g protein · {carbs}g carbs · {fat}g fat
        </p>

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
                  min="0.1"
                  step="0.1"
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors pr-24"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 truncate max-w-20 text-right">
                  {entry.servingSize ?? `×${entry.servingQuantity}g`}
                </span>
              </div>
              <p className="text-xs text-zinc-600">
                = {Math.round(gramsValue)}g
              </p>
            </div>
          ) : (
            <div className="relative">
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                min="1"
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                g
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 border border-red-900 text-red-500 hover:bg-red-950 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-40"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || gramsValue <= 0}
            className="flex-1 bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-40"
          >
            {loading ? "Saving…" : `Save ${calories} kcal`}
          </button>
        </div>
      </div>
    </>
  );
}
