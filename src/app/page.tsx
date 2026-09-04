import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: topScores } = await supabase
    .from("leaderboard")
    .select("display_name, score, is_guest")
    .order("score", { ascending: false })
    .limit(5);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16 font-mono text-cyan-100">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-400 bg-clip-text text-4xl font-bold tracking-widest text-transparent drop-shadow-[0_0_16px_rgba(167,139,250,0.35)]">
          SPACE INVADERS
        </h1>
        <p className="max-w-md text-cyan-300/70">
          Defend the planet. Play as a guest or register to claim your spot on the leaderboard.
        </p>
        <div className="flex gap-3">
          <Link
            href="/play"
            className="rounded bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition hover:from-cyan-300 hover:to-violet-400"
          >
            Play now
          </Link>
          <Link
            href="/register"
            className="rounded border border-violet-400/50 px-4 py-2 text-violet-200 transition hover:border-violet-300 hover:text-violet-100"
          >
            Register
          </Link>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-lg border border-cyan-500/20 bg-slate-950/60 p-4 shadow-[0_0_25px_rgba(34,211,238,0.08)] backdrop-blur">
        <h2 className="mb-3 text-center text-lg text-cyan-200">Top 5</h2>
        <ol className="flex flex-col gap-1 text-sm">
          {topScores?.map((row, i) => (
            <li key={i} className="flex justify-between border-b border-cyan-900/40 py-1">
              <span>
                {i + 1}. {row.display_name}
                {row.is_guest && <span className="ml-1 text-xs text-fuchsia-300/70">(guest)</span>}
              </span>
              <span>{row.score}</span>
            </li>
          ))}
          {(!topScores || topScores.length === 0) && (
            <li className="text-center text-cyan-700">No scores yet</li>
          )}
        </ol>
        <div className="mt-3 text-center">
          <Link href="/leaderboard" className="text-xs text-cyan-300/70 underline hover:text-cyan-200">
            View full leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
