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
    <header className="flex items-center justify-between border-b border-green-900 px-6 py-4 font-mono">
      <Link href="/" className="text-lg font-bold tracking-widest text-green-400">
        SPACE INVADERS
      </Link>
      <nav className="flex items-center gap-4 text-sm text-green-500">
        <Link href="/play" className="hover:text-green-300">
          Play
        </Link>
        <Link href="/leaderboard" className="hover:text-green-300">
          Leaderboard
        </Link>
        {user ? (
          <>
            <span>{username ?? user.email}</span>
            <form action={signOut}>
              <button type="submit" className="hover:text-green-300">
                Logout
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-green-300">
              Login
            </Link>
            <Link href="/register" className="hover:text-green-300">
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
