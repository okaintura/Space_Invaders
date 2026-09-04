import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: scores, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("leaderboard")
      .select("user_id, display_name, score, is_guest, created_at")
      .order("score", { ascending: false })
      .limit(50),
  ]);

  if (error) {
    console.error("Failed to load leaderboard:", error.message);
  }

  const onBoard = user ? (scores?.some((row) => row.user_id === user.id) ?? false) : false;

  // only look this up when we need to tell an off-board user their rank
  let personalStanding: { score: number; rank: number } | null = null;
  if (user && !onBoard) {
    const { data: own } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("user_id", user.id)
      .maybeSingle();

    if (own) {
      const { count } = await supabase
        .from("leaderboard")
        .select("id", { count: "exact", head: true })
        .gt("score", own.score);
      personalStanding = { score: own.score, rank: (count ?? 0) + 1 };
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 font-mono text-green-400">
      <h1 className="mb-6 text-center text-2xl">LEADERBOARD</h1>
      {error && (
        <p className="mb-4 rounded border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          Could not load the leaderboard ({error.message}). Make sure supabase/schema.sql has
          been run in your Supabase project.
        </p>
      )}
      {user && (
        <p className="mb-4 text-sm text-green-500">
          {onBoard
            ? "Your best score is on the board below."
            : personalStanding
              ? `Your best score is ${personalStanding.score} — rank #${personalStanding.rank}.`
              : "Play a game to get on the leaderboard!"}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-green-800 text-green-600">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Name</th>
            <th className="py-2 pr-2 text-right">Score</th>
            <th className="py-2 pl-2 text-right">Date</th>
          </tr>
        </thead>
        <tbody>
          {scores?.map((row, i) => (
            <tr
              key={`${row.created_at}-${i}`}
              className={`border-b border-green-950 ${row.user_id === user?.id ? "text-white" : ""}`}
            >
              <td className="py-2 pr-2">{i + 1}</td>
              <td className="py-2 pr-2">
                {row.display_name}
                {row.user_id === user?.id && (
                  <span className="ml-2 text-xs text-green-500">(you)</span>
                )}
                {row.is_guest && (
                  <span className="ml-2 rounded bg-green-900 px-1.5 py-0.5 text-xs text-green-400">
                    GUEST
                  </span>
                )}
              </td>
              <td className="py-2 pr-2 text-right">{row.score}</td>
              <td className="py-2 pl-2 text-right text-green-700">
                {new Date(row.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {(!scores || scores.length === 0) && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-green-700">
                No scores yet — be the first!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
