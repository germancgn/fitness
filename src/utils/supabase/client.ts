import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseKey || !supabaseKey) {
  process.exit();
}

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
