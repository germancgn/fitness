import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const client = new Anthropic();

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { chat } = (await req.json()) as {
    chat: {
      content: string;
      role: "user" | "assistant";
    }[];
  };

  console.log(chat);

  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 400,
    messages: chat,
    thinking: { type: "disabled" },
    system:
      "You are a concise, encouraging nutrition coach. Be direct and practical. No fluff. Respond in plain text only — no markdown, no bullet points, no headers, no bold or italic.",
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
