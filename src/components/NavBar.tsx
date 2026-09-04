import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-cyan-500/20 bg-slate-950/70 px-6 py-4 font-mono backdrop-blur">
      <Link
        href="/"
        className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-400 bg-clip-text text-lg font-bold tracking-widest text-transparent drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]"
      >
        SPACE INVADERS
      </Link>
      <nav className="flex items-center gap-4 text-sm text-cyan-300/80">
        <Link href="/play" className="transition hover:text-cyan-200">
          Play
        </Link>
        <Link href="/leaderboard" className="transition hover:text-cyan-200">
          Leaderboard
        </Link>
        {user ? (
          <>
            <span className="text-violet-300">{username ?? user.email}</span>
            <form action={signOut}>
              <button type="submit" className="transition hover:text-cyan-200">
                Logout
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="transition hover:text-cyan-200">
              Login
            </Link>
            <Link href="/register" className="transition hover:text-cyan-200">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
