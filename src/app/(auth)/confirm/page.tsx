import Link from "next/link";

export default function ConfirmPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-white">Check your email</h1>
      <p className="text-sm text-zinc-400">
        We sent you a confirmation link. Click it to activate your account.
      </p>
      <p className="text-xs text-zinc-600">
        Didn't receive it? Check your spam folder.
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
