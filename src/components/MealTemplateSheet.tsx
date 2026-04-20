"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FoodItem } from "@/app/actions/food";
import { createCustomFood, lookupFood, searchFood } from "@/app/actions/food";
import type { MealTemplate, TemplateItem } from "@/app/actions/meals";
import {
  addItemToTemplate,
  deleteMealTemplate,
  logMealTemplate,
  removeItemFromTemplate,
} from "@/app/actions/meals";
import FoodScanner from "@/components/FoodScanner";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
] as const;

type View = "detail" | "addFood";
type AddTab = "search" | "manual";

type SearchResult = {
  id: number;
  offBarcode: string;
  name: string;
  calories: string | null;
  servingSize: string | null;
  servingQuantity: string | null;
  imageFrontUrl: string | null;
};

export default function MealTemplateSheet({
  template: initial,
  recentFoods = [],
  onClose,
  onDeleted,
}: {
  template: MealTemplate;
  recentFoods?: FoodItem[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [template, setTemplate] = useState(initial);
  const [view, setView] = useState<View>("detail");
  const [addTab, setAddTab] = useState<AddTab>("search");
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("lunch");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingFood, setPendingFood] = useState<SearchResult | null>(null);
  const [pendingGrams, setPendingGrams] = useState("100");
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();

  async function handleLog() {
    setLoading(true);
    await logMealTemplate(template.id, mealType);
    setLoading(false);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    setLoading(true);
    await deleteMealTemplate(template.id);
    setLoading(false);
    router.refresh();
    onDeleted();
  }

  async function handleRemoveItem(item: TemplateItem) {
    await removeItemFromTemplate(item.id);
    setTemplate((t) => ({
      ...t,
      items: t.items.filter((i) => i.id !== item.id),
      totalCalories:
        t.totalCalories -
        Math.round(((Number(item.calories) || 0) * item.quantity) / 100),
    }));
  }

  let debounce: ReturnType<typeof setTimeout>;
  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounce);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    debounce = setTimeout(async () => {
      setSearching(true);
      const results = await searchFood(value);
      setSearchResults(results as SearchResult[]);
      setSearching(false);
    }, 400);
  }

  async function handleSelectSearchResult(result: SearchResult) {
    setSearching(true);
    const item = await lookupFood(result.offBarcode);
    setSearching(false);
    if (!item) return;
    setPendingFood({ ...result, id: item.id });
    setPendingGrams(item.servingQuantity ?? "100");
  }

  async function handleConfirmAdd() {
    if (!pendingFood || !pendingFood.id) return;
    const qty = Number(pendingGrams) || 0;
    if (qty <= 0) return;
    setLoading(true);
    const newId = await addItemToTemplate(template.id, pendingFood.id, qty);
    const kcalPer100 = Number(pendingFood.calories) || 0;
    const newItem: TemplateItem = {
      id: newId ?? Date.now(),
      foodItemId: pendingFood.id,
      name: pendingFood.name,
      quantity: qty,
      calories: pendingFood.calories,
      protein: null,
      carbs: null,
      fat: null,
      servingSize: pendingFood.servingSize,
      servingQuantity: pendingFood.servingQuantity,
      imageFrontUrl: pendingFood.imageFrontUrl,
    };
    setTemplate((t) => ({
      ...t,
      items: [...t.items, newItem],
      totalCalories: t.totalCalories + Math.round((kcalPer100 * qty) / 100),
    }));
    setPendingFood(null);
    setQuery("");
    setSearchResults([]);
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-black/60 z-50 w-full cursor-default"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-60 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-w-lg mx-auto flex flex-col max-h-[85vh]">
        <div className="px-6 pt-5 pb-4 shrink-0 flex items-center justify-between border-b border-zinc-900">
          <div>
            <p className="text-white font-medium">{template.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {template.totalCalories} kcal total
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            Close
          </button>
        </div>

        {view === "detail" && (
          <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-4">
            {template.items.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">
                No foods yet. Add some below.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-900">
                {template.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0 mr-3">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {item.quantity}g ·{" "}
                        {Math.round(
                          ((Number(item.calories) || 0) * item.quantity) / 100,
                        )}{" "}
                        kcal
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      className="text-zinc-600 hover:text-red-500 transition-colors text-lg shrink-0 px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setView("addFood")}
              className="w-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              + Add food
            </button>

            {template.items.length > 0 && (
              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-900">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">
                  Log to
                </p>
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
                <button
                  type="button"
                  onClick={handleLog}
                  disabled={loading}
                  className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-40"
                >
                  {loading ? "Logging…" : `Log ${template.totalCalories} kcal`}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full border border-red-900 text-red-500 hover:bg-red-950 font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-40"
            >
              Delete meal
            </button>
          </div>
        )}

        {view === "addFood" && (
          <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setView("detail");
                  setPendingFood(null);
                  setQuery("");
                  setSearchResults([]);
                }}
                className="text-zinc-500 hover:text-white text-sm transition-colors"
              >
                ← Back
              </button>
              {!pendingFood && (
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 12h10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Scan
                </button>
              )}
            </div>

            {!pendingFood && (
              <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                {(["search", "manual"] as AddTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAddTab(t)}
                    className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${addTab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {!pendingFood && addTab === "search" && (
              <>
                <input
                  type="search"
                  placeholder="Search foods…"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors"
                />
                {searching && (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    Searching…
                  </p>
                )}
                {!searching && searchResults.length > 0 && (
                  <div className="flex flex-col divide-y divide-zinc-900">
                    {searchResults.map((r, i) => (
                      <button
                        key={`${r.offBarcode}-${i}`}
                        type="button"
                        onClick={() => handleSelectSearchResult(r)}
                        className="flex items-center justify-between py-3 text-left hover:bg-zinc-900 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm text-white">{r.name}</p>
                          <p className="text-xs text-zinc-500">
                            {r.calories
                              ? `${Math.round(Number(r.calories))} kcal`
                              : "—"}{" "}
                            per 100g
                          </p>
                        </div>
                        <span className="text-zinc-600 text-lg shrink-0">
                          +
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {!searching && query && searchResults.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">
                    No results found.
                  </p>
                )}
                {!query && recentFoods.length > 0 && (
                  <>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">
                      Recent
                    </p>
                    <div className="flex flex-col divide-y divide-zinc-900">
                      {recentFoods.map((food) => (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => {
                            setPendingFood({
                              id: food.id,
                              offBarcode: "",
                              name: food.name,
                              calories: food.calories,
                              servingSize: food.servingSize,
                              servingQuantity: food.servingQuantity,
                              imageFrontUrl: food.imageFrontUrl,
                            });
                            setPendingGrams(food.servingQuantity ?? "100");
                          }}
                          className="flex items-center justify-between py-3 text-left hover:bg-zinc-900 -mx-2 px-2 rounded-lg transition-colors"
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm text-white">{food.name}</p>
                            <p className="text-xs text-zinc-500">
                              {food.calories
                                ? `${Math.round(Number(food.calories))} kcal`
                                : "—"}{" "}
                              per 100g
                            </p>
                          </div>
                          <span className="text-zinc-600 text-lg shrink-0">
                            +
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {!pendingFood && addTab === "manual" && (
              <form
                action={async (fd) => {
                  setLoading(true);
                  const item = await createCustomFood(fd);
                  setLoading(false);
                  setPendingFood({
                    id: item.id,
                    offBarcode: "",
                    name: item.name,
                    calories: item.calories,
                    servingSize: item.servingSize,
                    servingQuantity: item.servingQuantity,
                    imageFrontUrl: item.imageFrontUrl,
                  });
                  setPendingGrams(item.servingQuantity ?? "100");
                }}
                className="flex flex-col gap-4 pt-1"
              >
                <ManualField
                  name="name"
                  label="Food name"
                  placeholder="e.g. Scrambled eggs"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <ManualField
                    name="calories"
                    label="Calories"
                    placeholder="0"
                    unit="kcal"
                    type="number"
                  />
                  <ManualField
                    name="protein"
                    label="Protein"
                    placeholder="0"
                    unit="g"
                    type="number"
                  />
                  <ManualField
                    name="carbs"
                    label="Carbs"
                    placeholder="0"
                    unit="g"
                    type="number"
                  />
                  <ManualField
                    name="fat"
                    label="Fat"
                    placeholder="0"
                    unit="g"
                    type="number"
                  />
                </div>
                <p className="text-xs text-zinc-600">
                  All values are per 100g.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-40"
                >
                  {loading ? "Adding…" : "Next →"}
                </button>
              </form>
            )}

            {pendingFood && (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-white font-medium">{pendingFood.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {pendingFood.calories
                      ? `${Math.round(Number(pendingFood.calories))} kcal per 100g`
                      : "No calorie data"}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">
                    Quantity
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      value={pendingGrams}
                      onChange={(e) => setPendingGrams(e.target.value)}
                      min="1"
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                      g
                    </span>
                  </div>
                  {pendingFood.servingSize && (
                    <p className="text-xs text-zinc-600">
                      1 serving = {pendingFood.servingSize}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  disabled={
                    loading || !pendingGrams || Number(pendingGrams) <= 0
                  }
                  className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-40"
                >
                  {loading ? "Adding…" : "Add to meal"}
                </button>
              </div>
            )}
          </div>
        )}

        {showScanner && (
          <FoodScanner
            onFood={(item) => {
              setShowScanner(false);
              setPendingFood({
                id: item.id,
                offBarcode: "",
                name: item.name,
                calories: item.calories,
                servingSize: item.servingSize,
                servingQuantity: item.servingQuantity,
                imageFrontUrl: item.imageFrontUrl,
              });
              setPendingGrams(item.servingQuantity ?? "100");
              setView("addFood");
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </>
  );
}

function ManualField({
  name,
  label,
  placeholder,
  unit,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  unit?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs text-zinc-500 uppercase tracking-wide"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          min={type === "number" ? "0" : undefined}
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors pr-10"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
