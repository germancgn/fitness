"use client";

import { createMealTemplate, getMealTemplates } from "@/app/actions/meals";
import type { MealTemplate } from "@/app/actions/meals";
import MealTemplateSheet from "@/components/MealTemplateSheet";
import { useEffect, useState } from "react";

export default function MealsTab() {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState<MealTemplate | null>(null);

  useEffect(() => {
    getMealTemplates().then((t) => {
      setTemplates(t);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(false);
    setLoading(true);
    const id = await createMealTemplate(name);
    const fresh = await getMealTemplates();
    setTemplates(fresh);
    setLoading(false);
    setNewName("");
    const created = fresh.find((t) => t.id === id);
    if (created) setSelected(created);
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 text-center py-8">Loading…</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-3 pt-2">
        {templates.length === 0 && !creating && (
          <p className="text-sm text-zinc-500 text-center py-6">
            No meals yet. Create one to log multiple foods at once.
          </p>
        )}

        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t)}
            className="flex items-center justify-between py-3 px-3 bg-zinc-900 rounded-xl text-left hover:bg-zinc-800 transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-white font-medium">{t.name}</p>
              <p className="text-xs text-zinc-500">
                {t.items.length} food{t.items.length !== 1 ? "s" : ""} ·{" "}
                {t.totalCalories} kcal
              </p>
            </div>
            <span className="text-zinc-600 text-lg shrink-0">›</span>
          </button>
        ))}

        {creating ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Meal name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              className="flex-1 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-40"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="text-zinc-500 hover:text-white text-sm px-2 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            + Create meal
          </button>
        )}
      </div>

      {selected && (
        <MealTemplateSheet
          template={selected}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setTemplates((ts) => ts.filter((t) => t.id !== selected.id));
            setSelected(null);
          }}
        />
      )}
    </>
  );
}
