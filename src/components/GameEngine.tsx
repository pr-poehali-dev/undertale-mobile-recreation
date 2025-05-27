import React, { useEffect, useRef, useState, useCallback } from "react";

interface GameState {
  scene: "menu" | "intro" | "ruins" | "battle" | "dialogue";
  playerX: number;
  playerY: number;
  playerDirection: "up" | "down" | "left" | "right";
  currentDialogue: string | null;
  battleActive: boolean;
  currentRoom: number;
  puzzleSolved: boolean[];
  npcMet: boolean[];
  playerSprite: number;
}

interface NPC {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  dialogue: string[];
  sprite: string;
  room: number;
}

interface PuzzleElement {
  x: number;
  y: number;
  type: "switch" | "rock" | "door";
  active: boolean;
  room: number;
  id: number;
}

const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    scene: "menu",
    playerX: 160,
    playerY: 180,
    playerDirection: "down",
    currentDialogue: null,
    battleActive: false,
    currentRoom: 0,
    puzzleSolved: [false, false, false],
    npcMet: [false, false],
    playerSprite: 0,
  });

  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentNPC, setCurrentNPC] = useState<NPC | null>(null);

  // NPC персонажи
  const npcs: NPC[] = [
    {
      x: 160,
      y: 80,
      width: 32,
      height: 48,
      name: "Flowey",
      dialogue: [
        "Привет! Я Флауи! Флауи-цветочек!",
        "Ты новенький в ПОДЗЕМЕЛЬЕ, не так ли?",
        "Кто-то должен научить тебя, как все здесь устроено!",
        "Я думаю, что этим кем-то буду я!",
      ],
      sprite: "flowey",
      room: 0,
    },
    {
      x: 160,
      y: 60,
      width: 32,
      height: 64,
      name: "Toriel",
      dialogue: [
        "О, дитя мое! Ты здесь!",
        "Я Ториэль, хранительница РУИН.",
        "Я прохожу здесь каждый день, чтобы проверить...",
        "Не упал ли кто из людей.",
      ],
      sprite: "toriel",
      room: 1,
    },
  ];

  // Головоломки
  const [puzzleElements, setPuzzleElements] = useState<PuzzleElement[]>([
    { x: 80, y: 120, type: "switch", active: false, room: 1, id: 0 },
    { x: 200, y: 100, type: "rock", active: false, room: 1, id: 1 },
    { x: 160, y: 40, type: "door", active: false, room: 1, id: 2 },
  ]);

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

  // Улучшенный Frisk
  const drawPlayer = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      direction: string,
      frame: number,
    ) => {
      // Основные цвета Frisk
      const skinColor = "#FFCC99";
      const shirtColor = "#0066FF";
      const pantsColor = "#330066";
      const hairColor = "#8B4513";

      // Анимация ходьбы
      const walkOffset = Math.sin(frame * 0.3) * 1;

      // Голова
      drawPixelRect(ctx, x + 8, y, 16, 16, skinColor);

      // Волосы
      drawPixelRect(ctx, x + 6, y - 2, 20, 8, hairColor);

      // Глаза
      drawPixelRect(ctx, x + 10, y + 4, 2, 2, "#000000");
      drawPixelRect(ctx, x + 20, y + 4, 2, 2, "#000000");

      // Улыбка (если смотрит вниз)
      if (direction === "down") {
        drawPixelRect(ctx, x + 12, y + 8, 8, 1, "#000000");
      }

      // Тело
      drawPixelRect(ctx, x + 6, y + 16, 20, 20, shirtColor);

      // Руки
      const armY = y + 18 + walkOffset;
      drawPixelRect(ctx, x + 2, armY, 6, 16, skinColor);
      drawPixelRect(ctx, x + 24, armY, 6, 16, skinColor);

      // Ноги
      const legY = y + 36 + walkOffset;
      drawPixelRect(ctx, x + 8, legY, 6, 16, pantsColor);
      drawPixelRect(ctx, x + 18, legY, 6, 16, pantsColor);

      // Обувь
      drawPixelRect(ctx, x + 6, y + 50, 10, 4, "#000000");
      drawPixelRect(ctx, x + 16, y + 50, 10, 4, "#000000");
    },
    [drawPixelRect],
  );

  // Рисование NPC
  const drawNPC = useCallback(
    (ctx: CanvasRenderingContext2D, npc: NPC) => {
      if (npc.sprite === "flowey") {
        // Флауи
        drawPixelRect(ctx, npc.x + 8, npc.y + 24, 16, 8, "#228B22"); // стебель
        drawPixelRect(ctx, npc.x, npc.y, 32, 24, "#FFD700"); // лепестки
        drawPixelRect(ctx, npc.x + 8, npc.y + 4, 16, 16, "#FFFF00"); // центр
        drawPixelRect(ctx, npc.x + 10, npc.y + 8, 3, 3, "#000000"); // левый глаз
        drawPixelRect(ctx, npc.x + 19, npc.y + 8, 3, 3, "#000000"); // правый глаз
        drawPixelRect(ctx, npc.x + 12, npc.y + 14, 8, 2, "#000000"); // улыбка
      } else if (npc.sprite === "toriel") {
        // Ториэль
        drawPixelRect(ctx, npc.x, npc.y, 32, 64, "#E6E6FA"); // тело
        drawPixelRect(ctx, npc.x + 8, npc.y - 8, 16, 16, "#E6E6FA"); // голова
        drawPixelRect(ctx, npc.x + 10, npc.y - 4, 3, 3, "#000000"); // левый глаз
        drawPixelRect(ctx, npc.x + 19, npc.y - 4, 3, 3, "#000000"); // правый глаз
        drawPixelRect(ctx, npc.x + 4, npc.y + 8, 24, 32, "#800080"); // платье
        // Рога
        drawPixelRect(ctx, npc.x + 6, npc.y - 12, 4, 8, "#FFFFFF");
        drawPixelRect(ctx, npc.x + 22, npc.y - 12, 4, 8, "#FFFFFF");
      }
    },
    [drawPixelRect],
  );

  // Рисование головоломок
  const drawPuzzleElements = useCallback(
    (ctx: CanvasRenderingContext2D, room: number) => {
      puzzleElements
        .filter((elem) => elem.room === room)
        .forEach((elem) => {
          if (elem.type === "switch") {
            const color = elem.active ? "#00FF00" : "#FF0000";
            drawPixelRect(ctx, elem.x, elem.y, 16, 8, color);
            drawPixelRect(ctx, elem.x + 4, elem.y - 4, 8, 4, "#666666");
          } else if (elem.type === "rock") {
            drawPixelRect(ctx, elem.x, elem.y, 24, 24, "#666666");
            drawPixelRect(ctx, elem.x + 4, elem.y + 4, 16, 16, "#999999");
          } else if (elem.type === "door") {
            const color = elem.active ? "#00AA00" : "#AA0000";
            drawPixelRect(ctx, elem.x, elem.y, 32, 48, color);
            drawPixelRect(ctx, elem.x + 8, elem.y + 16, 4, 4, "#FFD700");
          }
        });
    },
    [puzzleElements, drawPixelRect],
  );

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, scene: string, room: number) => {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 640, 480);

      if (scene === "intro") {
        // Вступительная сцена
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, 640, 480);

        // Дыра наверху
        ctx.fillStyle = "#000000";
        ctx.fillRect(280, 0, 80, 100);

        // Цветы внизу
        for (let i = 0; i < 640; i += 40) {
          drawPixelRect(ctx, i, 420, 32, 32, "#FFD700");
          drawPixelRect(ctx, i + 8, 440, 16, 16, "#228B22");
        }
      } else if (scene === "ruins") {
        // Руины с детализированными стенами
        ctx.fillStyle = "#2D1B69";
        ctx.fillRect(0, 0, 640, 480);

        // Детализированные стены с кирпичной текстурой
        ctx.fillStyle = "#4A4A4A";

        // Верхняя стена
        for (let i = 0; i < 640; i += 32) {
          drawPixelRect(ctx, i, 0, 32, 64, "#6A6A6A");
          drawPixelRect(ctx, i + 4, 4, 24, 56, "#5A5A5A");
          // Кирпичная текстура
          for (let j = 0; j < 64; j += 16) {
            drawPixelRect(ctx, i + 8, j, 16, 2, "#4A4A4A");
          }
        }

        // Нижняя стена
        for (let i = 0; i < 640; i += 32) {
          drawPixelRect(ctx, i, 416, 32, 64, "#6A6A6A");
          drawPixelRect(ctx, i + 4, 420, 24, 56, "#5A5A5A");
        }

        // Боковые стены
        for (let i = 64; i < 416; i += 32) {
          drawPixelRect(ctx, 0, i, 64, 32, "#6A6A6A");
          drawPixelRect(ctx, 576, i, 64, 32, "#6A6A6A");
        }

        // Пол с узором
        for (let x = 64; x < 576; x += 64) {
          for (let y = 64; y < 416; y += 64) {
            drawPixelRect(ctx, x, y, 64, 64, "#3A2A5A");
            drawPixelRect(ctx, x + 8, y + 8, 48, 48, "#4A3A6A");
          }
        }

        // Дверные проемы между комнатами
        if (room === 0) {
          // Проход в следующую комнату
          drawPixelRect(ctx, 304, 0, 32, 64, "#2D1B69");
        } else if (room === 1) {
          // Проходы в обе стороны
          drawPixelRect(ctx, 304, 0, 32, 64, "#2D1B69");
          drawPixelRect(ctx, 304, 416, 32, 64, "#2D1B69");
        }
      }
    },
    [drawPixelRect],
  );

  const checkNPCInteraction = useCallback(() => {
    const currentRoomNPCs = npcs.filter(
      (npc) => npc.room === gameState.currentRoom,
    );

    for (const npc of currentRoomNPCs) {
      const distance = Math.sqrt(
        Math.pow(gameState.playerX - npc.x, 2) +
          Math.pow(gameState.playerY - npc.y, 2),
      );

      if (distance < 40) {
        setCurrentNPC(npc);
        setDialogVisible(true);
        return;
      }
    }
  }, [gameState.playerX, gameState.playerY, gameState.currentRoom, npcs]);

  const checkPuzzleInteraction = useCallback(() => {
    const currentRoomPuzzles = puzzleElements.filter(
      (elem) => elem.room === gameState.currentRoom,
    );

    for (const puzzle of currentRoomPuzzles) {
      const distance = Math.sqrt(
        Math.pow(gameState.playerX - puzzle.x, 2) +
          Math.pow(gameState.playerY - puzzle.y, 2),
      );

      if (distance < 30 && puzzle.type === "switch") {
        setPuzzleElements((prev) =>
          prev.map((elem) =>
            elem.id === puzzle.id ? { ...elem, active: !elem.active } : elem,
          ),
        );
        return;
      }
    }
  }, [
    gameState.playerX,
    gameState.playerY,
    gameState.currentRoom,
    puzzleElements,
  ]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Обновление позиции игрока
    let newX = gameState.playerX;
    let newY = gameState.playerY;
    let newDirection = gameState.playerDirection;
    let newRoom = gameState.currentRoom;
    let moved = false;

    const speed = 3;

    if (keys.has("ArrowUp") || keys.has("w")) {
      newY = Math.max(64, newY - speed);
      newDirection = "up";
      moved = true;

      // Переход между комнатами
      if (
        newY <= 64 &&
        newX > 304 &&
        newX < 336 &&
        gameState.currentRoom === 1
      ) {
        newRoom = 0;
        newY = 380;
      }
    }
    if (keys.has("ArrowDown") || keys.has("s")) {
      newY = Math.min(400, newY + speed);
      newDirection = "down";
      moved = true;

      // Переход между комнатами
      if (
        newY >= 400 &&
        newX > 304 &&
        newX < 336 &&
        gameState.currentRoom === 0
      ) {
        newRoom = 1;
        newY = 80;
      }
    }
    if (keys.has("ArrowLeft") || keys.has("a")) {
      newX = Math.max(64, newX - speed);
      newDirection = "left";
      moved = true;
    }
    if (keys.has("ArrowRight") || keys.has("d")) {
      newX = Math.min(560, newX + speed);
      newDirection = "right";
      moved = true;
    }

    // Обновление спрайта анимации
    let newSprite = gameState.playerSprite;
    if (moved) {
      newSprite = (newSprite + 1) % 60;
    }

    setGameState((prev) => ({
      ...prev,
      playerX: newX,
      playerY: newY,
      playerDirection: newDirection,
      currentRoom: newRoom,
      playerSprite: newSprite,
    }));

    // Рендеринг
    drawBackground(ctx, gameState.scene, gameState.currentRoom);

    if (gameState.scene === "ruins" || gameState.scene === "intro") {
      // Рисование головоломок
      drawPuzzleElements(ctx, gameState.currentRoom);

      // Рисование NPC
      npcs
        .filter((npc) => npc.room === gameState.currentRoom)
        .forEach((npc) => drawNPC(ctx, npc));

      // Рисование игрока
      drawPlayer(
        ctx,
        gameState.playerX,
        gameState.playerY,
        gameState.playerDirection,
        gameState.playerSprite,
      );
    }
  }, [
    gameState,
    keys,
    drawBackground,
    drawPlayer,
    drawNPC,
    drawPuzzleElements,
  ]);

  useEffect(() => {
    const gameInterval = setInterval(gameLoop, 16);
    return () => clearInterval(gameInterval);
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => new Set(prev).add(e.key));

      // Взаимодействие
      if (e.key === "z" || e.key === "Z") {
        checkNPCInteraction();
        checkPuzzleInteraction();
      }
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
  }, [checkNPCInteraction, checkPuzzleInteraction]);

  const startGame = () => {
    setGameState((prev) => ({ ...prev, scene: "intro" }));
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, scene: "ruins" }));
    }, 3000);
  };

  const handleDialogComplete = () => {
    setDialogVisible(false);
    setCurrentNPC(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="border-2 border-white"
        style={{ imageRendering: "pixelated" }}
      />

      {gameState.scene === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
          <div className="text-8xl font-mono mb-8 text-yellow-400 animate-pulse">
            PIXlROOM ™
          </div>
          <div className="text-2xl font-mono mb-8 text-gray-300">
            A Pixel Adventure
          </div>
          <button
            onClick={startGame}
            className="text-2xl font-mono border-2 border-white px-8 py-4 hover:bg-white hover:text-black transition-colors animate-bounce"
          >
            Начать приключение
          </button>
          <p className="text-sm font-mono mt-8 text-gray-400">
            WASD/Стрелки - движение • Z - взаимодействие
          </p>
        </div>
      )}

      {gameState.scene === "intro" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center font-mono">
            <p className="text-2xl mb-4 animate-fade-in">Давным-давно...</p>
            <p className="text-xl animate-fade-in">
              Два народа правили Землей...
            </p>
          </div>
        </div>
      )}

      {/* Улучшенная система диалогов */}
      {dialogVisible && currentNPC && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-50">
          <div className="w-full max-w-4xl mx-4 mb-4 bg-black border-4 border-white">
            <div className="flex">
              {/* Портрет персонажа */}
              <div className="w-32 h-32 bg-gray-800 border-r-2 border-white flex items-center justify-center">
                <div className="text-6xl">
                  {currentNPC.sprite === "flowey" ? "🌻" : "👑"}
                </div>
              </div>

              {/* Диалог */}
              <div className="flex-1">
                <div className="bg-white text-black px-4 py-2 font-mono font-bold">
                  {currentNPC.name}
                </div>
                <div className="p-6 text-white font-mono text-lg leading-relaxed min-h-[120px]">
                  {currentNPC.dialogue[0]}
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4">
              <button
                onClick={handleDialogComplete}
                className="text-yellow-400 font-mono animate-bounce"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameEngine;
