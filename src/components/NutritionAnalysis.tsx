"use client";

import { useEffect, useRef, useState } from "react";
import { readStream } from "@/utils/readStream";
import SparkleIcon from "./icons/SparkleIcon";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
};

const STORAGE_KEY = (date: string) => `nutrition-chat-${date}`;

function loadChat(date: string): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY(date));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function NutritionAnalysis({ date }: { date: string }) {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [userText, setUserText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const chatRef = useRef<HTMLUListElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const stopScrollRef = useRef(false);
  // Tracks which date the current chat state belongs to
  const chatDateRef = useRef(date);

  // Reload chat from localStorage when date changes
  useEffect(() => {
    chatDateRef.current = date;
    setChat(loadChat(date));
  }, [date]);

  // Persist chat to localStorage whenever it changes.
  // Uses chatDateRef instead of date in deps to avoid saving the previous
  // day's chat under the new date when both change in the same render cycle.
  // biome-ignore lint/correctness/useExhaustiveDependencies(chatDateRef): ref is intentionally excluded
  useEffect(() => {
    if (chat.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY(chatDateRef.current),
        JSON.stringify(chat),
      );
    } catch {}
  }, [chat]);

  // biome-ignore lint/correctness/useExhaustiveDependencies(chat): ignore chat dependency
  useEffect(() => {
    if (stopScrollRef.current) return;
    if (chatRef.current) {
      chatRef.current.scroll({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat]);

  async function analyze() {
    if (isAnalyzing || isSending) return;
    setIsAnalyzing(true);
    setMinimized(false);
    setError("");

    const assistantId = crypto.randomUUID();
    setChat((prev) => [
      ...prev,
      { id: assistantId, content: "", role: "assistant" },
    ]);

    try {
      const now = new Date();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          currentHour: now.getHours(),
          today: new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10),
        }),
      });

      if (!res.ok || !res.body) {
        setChat((prev) => prev.filter((m) => m.id !== assistantId));
        setError("Analysis failed. Try again.");
        setIsAnalyzing(false);
        return;
      }

      await readStream(res.body, (chunk) => {
        setChat((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      });
    } catch {
      setChat((prev) => prev.filter((m) => m.id !== assistantId));
      setError("Something went wrong. Try again.");
    }

    setIsAnalyzing(false);
  }

  async function onSend() {
    const trimmedText = userText.trim();
    if (!trimmedText || isSending || isAnalyzing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content: trimmedText,
      role: "user",
    };
    const nextChat = [...chat, userMessage];

    setUserText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setChat(nextChat);
    setIsSending(true);
    setError("");
    setMinimized(false);
    stopScrollRef.current = false;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        chat: nextChat.map(({ content, role }) => ({ content, role })),
      }),
    });

    if (!res.ok || !res.body) {
      setError("Failed to send. Try again.");
      setIsSending(false);
      return;
    }

    const assistantId = crypto.randomUUID();
    setChat((prev) => [
      ...prev,
      { id: assistantId, content: "", role: "assistant" },
    ]);

    await readStream(res.body, (chunk) => {
      setChat((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: m.content + chunk } : m,
        ),
      );
    });

    setIsSending(false);
  }

  const isLoading = isAnalyzing || isSending;
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {chat.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <SparkleIcon size={18} />
            <span className="text-sm font-medium text-white">AI Coach</span>
            {!isLoading && (
              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMinimized((v) => !v)}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                  aria-label={minimized ? "Expand" : "Minimize"}
                >
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    {minimized ? (
                      <path d="M2 5l5 4 5-4" />
                    ) : (
                      <path d="M2 9l5-4 5 4" />
                    )}
                  </svg>
                </button>
              </div>
            )}
            {isLoading && (
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
            )}
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${minimized ? "max-h-0" : "max-h-125"}`}
          >
            <div className="px-4 py-3">
              <ul
                ref={chatRef}
                className="flex flex-col gap-3 max-h-96 overflow-y-scroll"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  stopScrollRef.current =
                    el.scrollHeight - el.scrollTop - el.clientHeight > 50;
                }}
              >
                {chat.map(({ id, content, role }) => (
                  <li
                    key={id}
                    className={`text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] rounded-md px-2 py-1 ${
                      role === "user"
                        ? "ml-auto bg-blue-500 text-zinc-100"
                        : "mr-auto bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    {content}
                    {isLoading &&
                      role === "assistant" &&
                      id === chat[chat.length - 1].id &&
                      content === "" && (
                        <span className="inline-block w-0.5 h-4 bg-zinc-500 ml-0.5 animate-pulse align-text-bottom" />
                      )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-end gap border rounded-xl border-zinc-800 bg-zinc-950 overflow-hidden focus-within:border-zinc-700 focus-within:bg-zinc-900 transition-colors">
        <textarea
          ref={textareaRef}
          value={userText}
          rows={1}
          placeholder="Ask your coach…"
          disabled={isLoading}
          className="w-full text-sm rounded-md px-4 py-2 outline-none resize-none overflow-hidden placeholder:text-zinc-600 disabled:opacity-50 self-center"
          onChange={(e) => {
            setUserText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              const isMobile = window.matchMedia("(pointer: coarse)").matches;
              if (!isMobile) {
                e.preventDefault();
                onSend();
              }
            }
          }}
          maxLength={512}
        />
        <div className="flex shrink-0 items-center gap-2 pt-2 pr-2 pb-2">
          {userText.length > 400 && (
            <span
              className={`text-xs tabular-nums ${userText.length > 490 ? "text-red-400" : "text-amber-500"}`}
            >
              {512 - userText.length}
            </span>
          )}
          {!userText && (
            <button
              type="button"
              onClick={analyze}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs text-zinc-300 shrink-0"
            >
              <SparkleIcon size={12} />
              Analyze
            </button>
          )}
          <button
            type="button"
            onClick={onSend}
            disabled={!userText.trim() || isLoading}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
