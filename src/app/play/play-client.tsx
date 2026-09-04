"use client";

import { useEffect, useState } from "react";
import GameCanvas from "@/components/Game/GameCanvas";
import NicknamePrompt from "@/components/NicknamePrompt";
import { createClient } from "@/lib/supabase/client";

const GUEST_NAME_KEY = "space-invaders-guest-name";

type PlayClientProps = {
  userId: string | null;
  username: string | null;
};

export default function PlayClient({ userId, username }: PlayClientProps) {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<{ score: number; saved: boolean } | null>(null);
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
    const { error } = await supabase.from("scores").insert({
      user_id: userId,
      display_name: displayName,
      score,
      is_guest: !userId,
    });
    setResult({ score, saved: !error });
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
      <div className="flex flex-col items-center gap-4 font-mono text-green-400">
        <h2 className="text-2xl">GAME OVER</h2>
        <p>Final score: {result.score}</p>
        {!result.saved && (
          <p className="text-sm text-red-400">Could not save your score. Please try again.</p>
        )}
        <button
          onClick={handlePlayAgain}
          className="rounded bg-green-500 px-4 py-2 font-bold text-black hover:bg-green-400"
        >
          Play again
        </button>
      </div>
    );
  }

  return <GameCanvas key={gameKey} onGameOver={handleGameOver} />;
}
