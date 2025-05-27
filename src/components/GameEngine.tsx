import React, { useEffect, useRef, useState, useCallback } from "react";

interface GameState {
  scene: "menu" | "ruins" | "battle" | "dialogue";
  playerX: number;
  playerY: number;
  playerDirection: "up" | "down" | "left" | "right";
  currentDialogue: string | null;
  battleActive: boolean;
}

const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    scene: "menu",
    playerX: 160,
    playerY: 120,
    playerDirection: "down",
    currentDialogue: null,
    battleActive: false,
  });

  const [keys, setKeys] = useState<Set<string>>(new Set());

  // Pixel art rendering
  const drawPixelRect = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      color: string,
    ) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
    },
    [],
  );

  const drawPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      // Простой пиксельный персонаж (как в Undertale)
      drawPixelRect(ctx, x, y, 16, 16, "#FFDD44"); // голова
      drawPixelRect(ctx, x + 4, y + 4, 2, 2, "#000000"); // левый глаз
      drawPixelRect(ctx, x + 10, y + 4, 2, 2, "#000000"); // правый глаз
      drawPixelRect(ctx, x + 2, y + 16, 12, 20, "#0066FF"); // тело
      drawPixelRect(ctx, x - 2, y + 20, 6, 12, "#FFDD44"); // левая рука
      drawPixelRect(ctx, x + 12, y + 20, 6, 12, "#FFDD44"); // правая рука
      drawPixelRect(ctx, x + 2, y + 36, 5, 16, "#000066"); // левая нога
      drawPixelRect(ctx, x + 9, y + 36, 5, 16, "#000066"); // правая нога
    },
    [drawPixelRect],
  );

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, scene: string) => {
      // Очистка canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 320, 240);

      if (scene === "ruins") {
        // Рисуем фон руин
        ctx.fillStyle = "#2D1B69";
        ctx.fillRect(0, 0, 320, 240);

        // Стены
        ctx.fillStyle = "#4A4A4A";
        for (let i = 0; i < 320; i += 32) {
          drawPixelRect(ctx, i, 0, 32, 32, "#6A6A6A");
          drawPixelRect(ctx, i, 208, 32, 32, "#6A6A6A");
        }
        for (let i = 32; i < 208; i += 32) {
          drawPixelRect(ctx, 0, i, 32, 32, "#6A6A6A");
          drawPixelRect(ctx, 288, i, 32, 32, "#6A6A6A");
        }
      }
    },
    [drawPixelRect],
  );

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Отключаем сглаживание для пиксельной графики
    ctx.imageSmoothingEnabled = false;

    // Обновление позиции игрока
    let newX = gameState.playerX;
    let newY = gameState.playerY;

    if (keys.has("ArrowUp") || keys.has("w")) {
      newY = Math.max(32, newY - 2);
      setGameState((prev) => ({ ...prev, playerDirection: "up" }));
    }
    if (keys.has("ArrowDown") || keys.has("s")) {
      newY = Math.min(176, newY + 2);
      setGameState((prev) => ({ ...prev, playerDirection: "down" }));
    }
    if (keys.has("ArrowLeft") || keys.has("a")) {
      newX = Math.max(32, newX - 2);
      setGameState((prev) => ({ ...prev, playerDirection: "left" }));
    }
    if (keys.has("ArrowRight") || keys.has("d")) {
      newX = Math.min(272, newX + 2);
      setGameState((prev) => ({ ...prev, playerDirection: "right" }));
    }

    setGameState((prev) => ({ ...prev, playerX: newX, playerY: newY }));

    // Рендеринг
    drawBackground(ctx, gameState.scene);
    if (gameState.scene === "ruins") {
      drawPlayer(ctx, gameState.playerX, gameState.playerY);
    }
  }, [gameState, keys, drawBackground, drawPlayer]);

  useEffect(() => {
    const gameInterval = setInterval(gameLoop, 16); // 60 FPS
    return () => clearInterval(gameInterval);
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => new Set(prev).add(e.key));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key);
        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setGameState((prev) => ({ ...prev, scene: "ruins" }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="border-2 border-white"
        style={{ imageRendering: "pixelated", width: "640px", height: "480px" }}
      />

      {gameState.scene === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
          <h1 className="text-6xl font-mono mb-8 text-yellow-400">UNDERTALE</h1>
          <button
            onClick={startGame}
            className="text-2xl font-mono border-2 border-white px-8 py-4 hover:bg-white hover:text-black transition-colors"
          >
            Начать игру
          </button>
          <p className="text-sm font-mono mt-8 text-gray-400">
            Используйте WASD или стрелки для движения
          </p>
        </div>
      )}
    </div>
  );
};

export default GameEngine;
