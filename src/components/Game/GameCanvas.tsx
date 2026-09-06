"use client";

import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/game/engine";

type GameCanvasProps = {
  onGameOver: (score: number) => void;
  startWave?: number;
};

export default function GameCanvas({ onGameOver, startWave }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(startWave ?? 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(
      canvas,
      {
        onScoreChange: setScore,
        onLivesChange: setLives,
        onWaveChange: setWave,
        onGameOver,
      },
      { startWave },
    );
    engine.start();

    const controlKeys = new Set([" ", "Spacebar", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);
    const handleKeyDown = (e: KeyboardEvent) => {
      // stop the browser's default scroll/page-down behavior for space & arrow keys
      if (controlKeys.has(e.key)) e.preventDefault();
      engine.handleKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (controlKeys.has(e.key)) e.preventDefault();
      engine.handleKeyUp(e.key);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      engine.stop();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // engine is intentionally created once per mount; onGameOver is stable enough for gameplay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 font-mono text-cyan-300">
      <div className="flex w-full max-w-[480px] justify-between text-sm">
        <span>SCORE: {score}</span>
        <span>WAVE: {wave}</span>
        <span>LIVES: {lives}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={GameEngine.WIDTH}
        height={GameEngine.HEIGHT}
        style={{ aspectRatio: `${GameEngine.WIDTH} / ${GameEngine.HEIGHT}` }}
        className="max-h-[75vh] w-auto max-w-full rounded border border-cyan-500/40 bg-black shadow-[0_0_30px_rgba(34,211,238,0.2)]"
      />
      <p className="text-xs text-cyan-600">Move: Left/Right or A/D · Shoot: Space</p>
    </div>
  );
}
