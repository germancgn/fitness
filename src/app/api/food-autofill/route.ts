import { cookies } from "next/headers";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { name } = (await req.json()) as { name: string };
  if (!name?.trim()) return new Response("Bad request", { status: 400 });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Typical nutritional values per 100g for: "${name}". Reply with ONLY a valid JSON object, no explanation: {"calories": number, "protein": number, "carbs": number, "fat": number}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return new Response("No JSON in response", { status: 500 });
    const data = JSON.parse(match[0]);
    return Response.json(data);
  } catch {
    return new Response("Failed to parse response", { status: 500 });
  }
}
