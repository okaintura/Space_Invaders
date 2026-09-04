"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GameCanvas from "@/components/Game/GameCanvas";
import NicknamePrompt from "@/components/NicknamePrompt";
import { createClient } from "@/lib/supabase/client";

const GUEST_NAME_KEY = "space-invaders-guest-name";
const COMPARISON_SIZE = 10;

type ComparisonRow = {
  displayName: string;
  score: number;
  isGuest: boolean;
  isYou: boolean;
};

type GameResult = {
  score: number;
  saved: boolean;
  rank: number;
  rows: ComparisonRow[];
};

type PlayClientProps = {
  userId: string | null;
  username: string | null;
};

export default function PlayClient({ userId, username }: PlayClientProps) {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    if (userId) {
      setReady(true);
      return;
    }
    const stored = sessionStorage.getItem(GUEST_NAME_KEY);
    if (stored) {
      setGuestName(stored);
      setReady(true);
    }
  }, [userId]);

  const handleNicknameSubmit = (name: string) => {
    sessionStorage.setItem(GUEST_NAME_KEY, name);
    setGuestName(name);
    setReady(true);
  };

  const handleGameOver = async (score: number) => {
    const displayName = userId ? (username ?? "Player") : (guestName ?? "Guest");
    const supabase = createClient();
    let saved = false;

    // only registered, logged-in users get their score persisted to the leaderboard
    if (userId) {
      const { error } = await supabase.from("scores").insert({
        user_id: userId,
        display_name: displayName,
        score,
        is_guest: false,
      });
      saved = !error;
    }

    const [{ count }, { data: top }] = await Promise.all([
      supabase.from("leaderboard").select("id", { count: "exact", head: true }).gt("score", score),
      supabase
        .from("leaderboard")
        .select("user_id, display_name, score, is_guest")
        .order("score", { ascending: false })
        .limit(COMPARISON_SIZE),
    ]);

    let rows: ComparisonRow[] = (top ?? []).map((r) => ({
      displayName: r.display_name,
      score: r.score,
      isGuest: r.is_guest,
      isYou: Boolean(userId) && r.user_id === userId,
    }));

    // guests (and any user whose new score didn't crack the persisted top list) get
    // their run merged into the comparison view without it ever being saved
    if (!rows.some((r) => r.isYou)) {
      rows = [...rows, { displayName, score, isGuest: !userId, isYou: true }]
        .sort((a, b) => b.score - a.score)
        .slice(0, COMPARISON_SIZE);
    }

    setResult({ score, saved, rank: (count ?? 0) + 1, rows });
  };

  const handlePlayAgain = () => {
    setResult(null);
    setGameKey((k) => k + 1);
  };

  if (!ready) {
    return <NicknamePrompt onSubmit={handleNicknameSubmit} />;
  }

  if (result) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-6 font-mono text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.1)] backdrop-blur">
        <h2 className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-400 bg-clip-text text-2xl text-transparent">
          GAME OVER
        </h2>
        <p>
          Final score: {result.score} · Rank #{result.rank}
        </p>
        {userId ? (
          !result.saved && (
            <p className="text-sm text-red-400">Could not save your score. Please try again.</p>
          )
        ) : (
          <p className="text-sm text-violet-300">
            Playing as guest — your score isn&apos;t saved.{" "}
            <Link href="/register" className="underline hover:text-violet-200">
              Register
            </Link>{" "}
            to make it onto the leaderboard.
          </p>
        )}

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-cyan-800/50 text-cyan-500">
              <th className="py-1 pr-2">#</th>
              <th className="py-1 pr-2">Name</th>
              <th className="py-1 pl-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-cyan-950/50 ${row.isYou ? "text-white" : ""}`}
              >
                <td className="py-1 pr-2">{i + 1}</td>
                <td className="py-1 pr-2">
                  {row.displayName}
                  {row.isYou && <span className="ml-2 text-xs text-cyan-300">(you)</span>}
                  {row.isGuest && !row.isYou && (
                    <span className="ml-2 rounded bg-fuchsia-950 px-1.5 py-0.5 text-xs text-fuchsia-300">
                      GUEST
                    </span>
                  )}
                </td>
                <td className="py-1 pl-2 text-right">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={handlePlayAgain}
          className="rounded bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition hover:from-cyan-300 hover:to-violet-400"
        >
          Play again
        </button>
      </div>
    );
  }

  return <GameCanvas key={gameKey} onGameOver={handleGameOver} />;
}
