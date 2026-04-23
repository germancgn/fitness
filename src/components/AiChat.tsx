"use client";

import { useEffect, useRef, useState } from "react";
import { readStream } from "@/utils/readStream";

type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "assistant";
};

export default function AiChat({
  initialMessage,
  onDismiss,
}: {
  initialMessage: string;
  onDismiss: () => void;
}) {
  const [chat, setChat] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), content: initialMessage, role: "assistant" },
  ]);
  const [userText, setUserText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const chatRef = useRef<HTMLUListElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const stopScrollRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies(chat): suppress dependency chat
  useEffect(() => {
    if (stopScrollRef.current) return;
    if (chatRef.current) {
      chatRef.current.scroll({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat]);

  async function onSend() {
    const trimmedText = userText.trim();
    if (!trimmedText || isSending) return;
    stopScrollRef.current = false;

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

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: msg.content + chunk }
            : msg,
        ),
      );
    });

    setIsSending(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
          <SparkleIcon />
          <span className="text-sm font-medium text-white">AI Analysis</span>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Dismiss
          </button>
        </div>
        <div className="px-4 py-3">
          {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
          <ul
            ref={chatRef}
            className="flex flex-col gap-2 max-h-120 overflow-y-scroll"
            onScroll={(e) => {
              const el = e.currentTarget;
              const isAtBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 50;
              stopScrollRef.current = !isAtBottom;
            }}
          >
            {chat.map(({ id, content, role }) => (
              <li
                key={id}
                className={`text-sm leading-relaxed whitespace-pre-wrap rounded-md wrap-break-word ${
                  role === "user"
                    ? "ml-auto max-w-[85%] bg-blue-500 text-white px-2 py-1"
                    : "mr-auto text-zinc-300"
                }`}
              >
                {content}
                {isSending &&
                  role === "assistant" &&
                  id === chat[chat.length - 1].id &&
                  content === "" && (
                    <span className="inline-block w-0.5 h-4 bg-zinc-500 ml-0.5 animate-pulse align-text-bottom" />
                  )}
              </li>
            ))}
            {isSending && chat[chat.length - 1].role !== "assistant" && (
              <li className="mr-auto flex gap-1 items-center py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="flex items-end gap border rounded-xl border-zinc-800 bg-zinc-950 overflow-hidden focus-within:border-zinc-700 focus-within:bg-zinc-900 transition-colors">
        <textarea
          ref={textareaRef}
          value={userText}
          rows={1}
          placeholder="Ask a follow-up..."
          disabled={isSending}
          className="w-full text-sm rounded-md px-4 py-2 outline-none resize-none overflow-hidden placeholder:text-zinc-600 disabled:opacity-50 self-center"
          onChange={(e) => {
            setUserText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSend();
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
          <button
            type="button"
            onClick={onSend}
            disabled={!userText.trim() || isSending}
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

function SparkleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-400 shrink-0"
      aria-hidden="true"
    >
      <path d="M12 3l1.88 5.63L19 10l-5.12 1.37L12 17l-1.88-5.63L5 10l5.12-1.37z" />
      <path d="M5 3l.94 2.81L8 7l-2.06.69L5 10l-.94-2.81L2 7l2.06-.69z" />
      <path d="M19 17l.94 2.81L22 21l-2.06.69L19 24l-.94-2.81L16 21l2.06-.69z" />
    </svg>
  );
}
