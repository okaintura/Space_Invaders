import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: topScores } = await supabase
    .from("scores")
    .select("display_name, score, is_guest")
    .order("score", { ascending: false })
    .limit(5);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16 font-mono text-green-400">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-widest">SPACE INVADERS</h1>
        <p className="max-w-md text-green-600">
          Defend the planet. Play as a guest or register to claim your spot on the leaderboard.
        </p>
        <div className="flex gap-3">
          <Link
            href="/play"
            className="rounded bg-green-500 px-4 py-2 font-bold text-black hover:bg-green-400"
          >
            Play now
          </Link>
          <Link
            href="/register"
            className="rounded border border-green-600 px-4 py-2 hover:border-green-400"
          >
            Register
          </Link>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="mb-3 text-center text-lg">Top 5</h2>
        <ol className="flex flex-col gap-1 text-sm">
          {topScores?.map((row, i) => (
            <li key={i} className="flex justify-between border-b border-green-950 py-1">
              <span>
                {i + 1}. {row.display_name}
                {row.is_guest && <span className="ml-1 text-xs text-green-700">(guest)</span>}
              </span>
              <span>{row.score}</span>
            </li>
          ))}
          {(!topScores || topScores.length === 0) && (
            <li className="text-center text-green-700">No scores yet</li>
          )}
        </ol>
        <div className="mt-3 text-center">
          <Link href="/leaderboard" className="text-xs underline hover:text-green-300">
            View full leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
