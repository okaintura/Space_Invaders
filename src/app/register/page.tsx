import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16 font-mono">
      <div className="flex flex-col gap-6 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-6 shadow-[0_0_25px_rgba(34,211,238,0.1)] backdrop-blur">
        <h1 className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-400 bg-clip-text text-center text-2xl text-transparent">
          Register
        </h1>
        {error && (
          <p className="rounded border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <form action={signUp} className="flex flex-col gap-4">
          <input
            name="username"
            placeholder="Username"
            required
            minLength={3}
            maxLength={24}
            className="rounded border border-cyan-700/50 bg-slate-900/80 px-3 py-2 text-cyan-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded border border-cyan-700/50 bg-slate-900/80 px-3 py-2 text-cyan-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            minLength={6}
            className="rounded border border-cyan-700/50 bg-slate-900/80 px-3 py-2 text-cyan-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
          />
          <button
            type="submit"
            className="rounded bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-2 font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition hover:from-cyan-300 hover:to-violet-400"
          >
            Create account
          </button>
        </form>
        <p className="text-center text-sm text-cyan-400/70">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-cyan-300">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
