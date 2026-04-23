"use client";

import { useState } from "react";
import AiChat from "@/components/AiChat";
import { readStream } from "@/utils/readStream";
import SparkleIcon from "./icons/SparkleIcon";

export default function NutritionAnalysis({ date }: { date: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function analyze() {
    setState("loading");
    setText("");
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          currentHour: new Date().getHours(),
          today: new Date().toISOString().slice(0, 10),
        }),
      });

      if (!res.ok || !res.body) {
        setError("Analysis failed. Try again.");
        setState("idle");
        return;
      }

      await readStream(res.body, (chunk) => setText((prev) => prev + chunk));
      setState("done");
    } catch {
      setError("Something went wrong. Try again.");
      setState("idle");
    }
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={analyze}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
      >
        <SparkleIcon size={18} />
        Analyze today's nutrition
      </button>
    );
  }

  if (state === "done" && text) {
    return (
      <AiChat
        initialMessage={text}
        onDismiss={() => {
          setState("idle");
          setText("");
        }}
      />
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <SparkleIcon size={18} />
        <span className="text-sm font-medium text-white">AI Analysis</span>
        <span className="ml-auto flex gap-1 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
          <span
            className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      </div>
      <div className="px-4 py-3">
        {error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {text}
            <span className="inline-block w-0.5 h-4 bg-zinc-500 ml-0.5 animate-pulse align-text-bottom" />
          </p>
        )}
      </div>
    </div>
  );
}
