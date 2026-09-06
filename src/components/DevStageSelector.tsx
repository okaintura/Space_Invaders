"use client";

import { useState, type FormEvent } from "react";

const QUICK_WAVES = [1, 5, 6, 10, 11, 15, 16, 20];

type DevStageSelectorProps = {
  onSelect: (wave: number) => void;
};

export default function DevStageSelector({ onSelect }: DevStageSelectorProps) {
  const [wave, setWave] = useState("1");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Math.max(1, Math.floor(Number(wave)) || 1);
    onSelect(parsed);
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-fuchsia-500/30 bg-slate-950/60 p-6 font-mono text-cyan-100 shadow-[0_0_25px_rgba(217,70,239,0.15)] backdrop-blur">
      <h2 className="text-center text-lg text-fuchsia-300">DEV CONSOLE — Stage Select</h2>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_WAVES.map((w) => (
          <button
            key={w}
            onClick={() => onSelect(w)}
            className="rounded border border-fuchsia-500/40 px-2 py-1 text-xs text-fuchsia-200 transition hover:border-fuchsia-300 hover:text-fuchsia-100"
          >
            Wave {w}
            {w % 5 === 0 && <span className="ml-1 text-fuchsia-400">★</span>}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          min={1}
          value={wave}
          onChange={(e) => setWave(e.target.value)}
          className="w-full rounded border border-cyan-700/50 bg-slate-900/80 px-3 py-2 text-cyan-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-2 font-bold text-slate-950 transition hover:from-fuchsia-400 hover:to-violet-400"
        >
          Start
        </button>
      </form>
    </div>
  );
}
