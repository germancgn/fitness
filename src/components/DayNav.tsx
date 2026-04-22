"use client";

import { useRouter } from "next/navigation";

function offsetDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatLabel(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  if (dateStr === offsetDate(today, -1)) return "Yesterday";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function DayNav({ date }: { date: string }) {
  const router = useRouter();
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  const isToday = date === today;

  function go(days: number) {
    const next = offsetDate(date, days);
    if (next > today) return;
    router.push(next === today ? "/" : `/?date=${next}`);
  }

  return (
    <div className="flex items-center justify-between py-1">
      <button
        type="button"
        onClick={() => go(-1)}
        className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-900"
        aria-label="Previous day"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className="text-sm font-medium text-white">
        {formatLabel(date, today)}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={isToday}
        className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-900 disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Next day"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
