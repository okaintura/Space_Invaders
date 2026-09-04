import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: scores } = await supabase
    .from("scores")
    .select("display_name, score, is_guest, created_at")
    .order("score", { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 font-mono text-green-400">
      <h1 className="mb-6 text-center text-2xl">LEADERBOARD</h1>
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
            <tr key={`${row.created_at}-${i}`} className="border-b border-green-950">
              <td className="py-2 pr-2">{i + 1}</td>
              <td className="py-2 pr-2">
                {row.display_name}
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
