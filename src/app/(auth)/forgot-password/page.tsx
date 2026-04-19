import { forgotPassword } from "@/app/actions/auth";
import Link from "next/link";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-white">Check your email</h1>
        <p className="text-sm text-zinc-400">
          We sent a password reset link to your email address.
        </p>
        <Link
          href="/sign-in"
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-white">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <form action={forgotPassword} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors"
        />
        <button
          type="submit"
          className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors"
        >
          Send reset link
        </button>
      </form>

      <Link
        href="/sign-in"
        className="text-sm text-zinc-500 hover:text-white transition-colors"
      >
        ← Back to sign in
      </Link>
    </div>
  );
}
