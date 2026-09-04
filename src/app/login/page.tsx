import Link from "next/link";
import { signIn } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16 font-mono">
      <h1 className="text-center text-2xl text-green-400">Log in</h1>
      {message && (
        <p className="rounded border border-green-700 bg-green-950/50 px-3 py-2 text-sm text-green-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <form action={signIn} className="flex flex-col gap-4">
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
          className="rounded border border-green-700 bg-black px-3 py-2 text-green-200 outline-none focus:border-green-400"
        />
        <button
          type="submit"
          className="rounded bg-green-500 px-3 py-2 font-bold text-black transition hover:bg-green-400"
        >
          Log in
        </button>
      </form>
      <p className="text-center text-sm text-green-600">
        Need an account?{" "}
        <Link href="/register" className="underline hover:text-green-400">
          Register
        </Link>
      </p>
    </main>
  );
}
