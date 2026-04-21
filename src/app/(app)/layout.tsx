import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/utils/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/sign-in");

  const hasProfile = session.user.app_metadata?.has_profile === true;
  if (!hasProfile) redirect("/onboarding");

  return (
    <div className="pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
