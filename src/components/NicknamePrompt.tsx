"use client";

import { useState, type FormEvent } from "react";

type NicknamePromptProps = {
  onSubmit: (name: string) => void;
};

export default function NicknamePrompt({ onSubmit }: NicknamePromptProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 24) {
      setError("Nickname must be 1-24 characters.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xs flex-col gap-4 rounded-lg border border-cyan-500/20 bg-slate-950/60 p-6 font-mono text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.1)] backdrop-blur"
    >
      <h2 className="text-center text-lg text-cyan-200">Enter a nickname to play as guest</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nickname"
        maxLength={24}
        autoFocus
        className="rounded border border-cyan-700/50 bg-slate-900/80 px-3 py-2 text-cyan-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
      />
      <button
        type="submit"
        className="rounded bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-2 font-bold text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition hover:from-cyan-300 hover:to-violet-400"
      >
        Start playing
      </button>
    </form>
  );
}
