"use client";

import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/game/engine";

type GameCanvasProps = {
  onGameOver: (score: number) => void;
};

export default function GameCanvas({ onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onScoreChange: setScore,
      onLivesChange: setLives,
      onWaveChange: setWave,
      onGameOver,
    });
    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => engine.handleKeyDown(e.key);
    const handleKeyUp = (e: KeyboardEvent) => engine.handleKeyUp(e.key);
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
    <div className="flex flex-col items-center gap-3 font-mono text-green-400">
      <div className="flex w-full max-w-[480px] justify-between text-sm">
        <span>SCORE: {score}</span>
        <span>WAVE: {wave}</span>
        <span>LIVES: {lives}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={GameEngine.WIDTH}
        height={GameEngine.HEIGHT}
        className="border border-green-700 bg-black"
      />
      <p className="text-xs text-green-600">Move: Left/Right or A/D · Shoot: Space</p>
    </div>
  );
}
