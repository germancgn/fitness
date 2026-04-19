import { resetPassword } from "@/app/actions/auth";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Set new password</h1>
        <p className="mt-1 text-sm text-zinc-500">Choose a strong password.</p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <form action={resetPassword} className="flex flex-col gap-3">
        <input
          name="password"
          type="password"
          placeholder="New password"
          required
          minLength={8}
          className="w-full bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors"
        />
        <button
          type="submit"
          className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
