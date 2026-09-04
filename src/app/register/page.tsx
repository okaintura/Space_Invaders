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
      <h1 className="text-center text-2xl text-green-400">Register</h1>
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
          className="rounded border border-green-700 bg-black px-3 py-2 text-green-200 outline-none focus:border-green-400"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border border-green-700 bg-black px-3 py-2 text-green-200 outline-none focus:border-green-400"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={6}
          className="rounded border border-green-700 bg-black px-3 py-2 text-green-200 outline-none focus:border-green-400"
        />
        <button
          type="submit"
          className="rounded bg-green-500 px-3 py-2 font-bold text-black transition hover:bg-green-400"
        >
          Create account
        </button>
      </form>
      <p className="text-center text-sm text-green-600">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:text-green-400">
          Log in
        </Link>
      </p>
    </main>
  );
}
