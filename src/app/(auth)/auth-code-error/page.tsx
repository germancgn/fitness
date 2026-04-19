import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
      <p className="text-sm text-zinc-400">
        This link is invalid or has expired. Please try again.
      </p>
      <div className="flex flex-col gap-2 pt-2">
        <Link
          href="/sign-in"
          className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors text-center"
        >
          Back to sign in
        </Link>
        <Link
          href="/forgot-password"
          className="w-full bg-transparent border border-zinc-800 text-white font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-950 transition-colors text-center"
        >
          Reset password
        </Link>
      </div>
    </div>
  );
}
