import { signOut } from "@/app/actions/auth";
import FoodScanner from "@/components/FoodScanner";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <form action={signOut} className="absolute top-4 right-4">
        <button
          type="submit"
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </form>
      <FoodScanner />
    </div>
  );
}
