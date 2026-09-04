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
      className="flex w-full max-w-xs flex-col gap-4 font-mono text-green-400"
    >
      <h2 className="text-center text-lg">Enter a nickname to play as guest</h2>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nickname"
        maxLength={24}
        autoFocus
        className="rounded border border-green-700 bg-black px-3 py-2 text-green-200 outline-none focus:border-green-400"
      />
      <button
        type="submit"
        className="rounded bg-green-500 px-3 py-2 font-bold text-black hover:bg-green-400"
      >
        Start playing
      </button>
    </form>
  );
}
