"use client";

import { useState } from "react";

type MacroKey = "protein" | "carbs" | "fat";

type MacroEntry = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
};

type MacroCardConfig = {
  key: MacroKey;
  label: string;
  consumed: number;
  target: number;
  color: string;
  barColor: string;
};

function MacroCard({
  config,
  selected,
  onClick,
}: {
  config: MacroCardConfig;
  selected: boolean;
  onClick: () => void;
}) {
  const { label, consumed, target, color, barColor } = config;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-zinc-950 border rounded-xl p-4 flex flex-col gap-3 text-left transition-colors ${
        selected ? "border-zinc-600" : "border-zinc-900 hover:border-zinc-800"
      }`}
    >
      <p
        className={`text-xs font-medium ${selected ? color : "text-zinc-500"}`}
      >
        {label}
      </p>
      <p className="text-xl font-semibold text-white">
        {consumed}
        <span className="text-xs text-zinc-600 font-normal ml-0.5">g</span>
      </p>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${Math.min((consumed / target) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-zinc-600">of {target}g</p>
    </button>
  );
}

export default function MacroCards({
  totals,
  targets,
  entries,
}: {
  totals: { protein: number; carbs: number; fat: number };
  targets: { protein: number; carbs: number; fat: number };
  entries: MacroEntry[];
}) {
  const [selected, setSelected] = useState<MacroKey | null>(null);

  const cards: MacroCardConfig[] = [
    {
      key: "protein",
      label: "Protein",
      consumed: totals.protein,
      target: targets.protein,
      color: "text-blue-400",
      barColor: "bg-blue-500",
    },
    {
      key: "carbs",
      label: "Carbs",
      consumed: totals.carbs,
      target: targets.carbs,
      color: "text-yellow-400",
      barColor: "bg-yellow-500",
    },
    {
      key: "fat",
      label: "Fat",
      consumed: totals.fat,
      target: targets.fat,
      color: "text-orange-400",
      barColor: "bg-orange-500",
    },
  ];

  function toggle(key: MacroKey) {
    setSelected((prev) => (prev === key ? null : key));
  }

  const activeCard = cards.find((c) => c.key === selected);
  const sorted =
    selected && entries.length > 0
      ? [...entries]
          .filter((e) => e[selected] > 0)
          .sort((a, b) => b[selected] - a[selected])
      : [];

  const total = selected ? totals[selected] : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <MacroCard
            key={card.key}
            config={card}
            selected={selected === card.key}
            onClick={() => toggle(card.key)}
          />
        ))}
      </div>

      {selected && activeCard && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
          <p className={`text-xs font-medium ${activeCard.color}`}>
            {activeCard.label} breakdown
          </p>
          {sorted.length === 0 ? (
            <p className="text-xs text-zinc-600">No food logged yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sorted.map((entry, i) => {
                const pct = total > 0 ? (entry[selected] / total) * 100 : 0;
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static sorted list
                  <li key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-zinc-300 truncate mr-2">
                        {entry.name}
                      </span>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {entry[selected]}g
                      </span>
                    </div>
                    <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${activeCard.barColor} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
