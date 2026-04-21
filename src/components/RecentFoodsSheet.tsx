"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { FoodItem, SearchResult } from "@/app/actions/food";
import { createCustomFood, lookupFood, searchFood } from "@/app/actions/food";
import MealsTab from "@/components/MealsTab";
import { useSheet } from "@/hooks/useSheet";

type Tab = "recent" | "custom" | "meals";

export default function RecentFoodsSheet({
  foods,
  onSelect,
  onClose,
}: {
  foods: FoodItem[];
  onSelect: (food: FoodItem) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("recent");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { close, panelClass, backdropClass } = useSheet(onClose);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchFood(value);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }

  async function handleSelectSearchResult(result: SearchResult) {
    setLoading(true);
    const item = await lookupFood(result.offBarcode);
    setLoading(false);
    if (item) onSelect(item);
  }

  async function handleCustomSubmit(formData: FormData) {
    setLoading(true);
    const item = await createCustomFood(formData);
    setLoading(false);
    onSelect(item);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className={`fixed inset-0 bg-black/60 z-40 w-full cursor-default ${backdropClass}`}
        onClick={() => close()}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 rounded-t-2xl max-w-lg mx-auto flex flex-col max-h-[85vh] ${panelClass}`}
      >
        <div className="px-6 pt-5 pb-0 shrink-0 flex flex-col gap-4">
          <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto" />
          <div className="flex items-center justify-between">
            <p className="text-white font-medium">Add food</p>
            <button
              type="button"
              onClick={() => close()}
              className="text-zinc-500 hover:text-white transition-colors text-sm"
            >
              Close
            </button>
          </div>
          {tab !== "meals" && (
            <input
              type="search"
              placeholder="Search foods…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors"
            />
          )}
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            <TabButton
              active={tab === "recent"}
              onClick={() => setTab("recent")}
            >
              Recent
            </TabButton>
            <TabButton
              active={tab === "custom"}
              onClick={() => setTab("custom")}
            >
              Custom
            </TabButton>
            <TabButton active={tab === "meals"} onClick={() => setTab("meals")}>
              Meals
            </TabButton>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-6 pt-2">
          {tab === "recent" && searchResults !== null && (
            <div className="flex flex-col divide-y divide-zinc-900">
              {searching && (
                <p className="text-sm text-zinc-500 text-center py-8">
                  Searching…
                </p>
              )}
              {!searching && searchResults.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No results found.
                </p>
              )}
              {!searching &&
                searchResults.map((result, i) => (
                  <FoodRow
                    key={`${result.offBarcode}-${i}`}
                    name={result.name}
                    calories={result.calories}
                    imageFrontUrl={result.imageFrontUrl}
                    disabled={loading}
                    onClick={() => handleSelectSearchResult(result)}
                  />
                ))}
            </div>
          )}

          {tab === "recent" &&
            searchResults === null &&
            (foods.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No recent foods yet. Use the Scan button or add a custom food.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-900">
                {foods.map((food) => (
                  <FoodRow
                    key={food.id}
                    name={food.name}
                    calories={food.calories}
                    imageFrontUrl={food.imageFrontUrl}
                    onClick={() => onSelect(food)}
                  />
                ))}
              </div>
            ))}

          {tab === "custom" && (
            <form
              action={handleCustomSubmit}
              className="flex flex-col gap-4 pt-2"
            >
              <CustomField
                name="name"
                label="Food name"
                placeholder="e.g. Chicken breast"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <CustomField
                  name="calories"
                  label="Calories"
                  placeholder="0"
                  unit="kcal"
                  type="number"
                />
                <CustomField
                  name="protein"
                  label="Protein"
                  placeholder="0"
                  unit="g"
                  type="number"
                />
                <CustomField
                  name="carbs"
                  label="Carbs"
                  placeholder="0"
                  unit="g"
                  type="number"
                />
                <CustomField
                  name="fat"
                  label="Fat"
                  placeholder="0"
                  unit="g"
                  type="number"
                />
              </div>
              <p className="text-xs text-zinc-600">All values are per 100g.</p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-40"
              >
                {loading ? "Adding…" : "Add food"}
              </button>
            </form>
          )}

          {tab === "meals" && <MealsTab recentFoods={foods} />}
        </div>
      </div>
    </>
  );
}

function FoodRow({
  name,
  calories,
  imageFrontUrl,
  onClick,
  disabled,
}: {
  name: string;
  calories: string | null;
  imageFrontUrl: string | null;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 py-3 text-left hover:bg-zinc-900 -mx-2 px-2 rounded-lg transition-colors disabled:opacity-40"
    >
      {imageFrontUrl ? (
        <div className="relative w-10 h-10 shrink-0">
          <Image
            src={imageFrontUrl}
            alt={name}
            fill
            className="object-contain rounded"
          />
        </div>
      ) : (
        <div className="w-10 h-10 bg-zinc-800 rounded shrink-0 flex items-center justify-center">
          <span className="text-zinc-600 text-xs">?</span>
        </div>
      )}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="text-sm text-white truncate">{name}</p>
        <p className="text-xs text-zinc-500">
          {calories ? `${Math.round(Number(calories))} kcal` : "—"} per 100g
        </p>
      </div>
      <span className="text-zinc-600 text-lg shrink-0">+</span>
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function CustomField({
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
          step={type === "number" ? "0.1" : undefined}
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
