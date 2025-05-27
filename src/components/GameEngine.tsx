import { useState, useEffect, useRef, useCallback } from "react";

interface GameState {
  scene: "menu" | "intro" | "ruins" | "home" | "corridor" | "garden";
  playerX: number;
  playerY: number;
  playerDirection: "up" | "down" | "left" | "right";
  playerSprite: number;
  currentRoom: number;
  playerName: string;
  inventory: string[];
  gameProgress: {
    metFlowey: boolean;
    metToriel: boolean;
    foundKey: boolean;
    learnedAboutSave: boolean;
    completedPuzzle1: boolean;
  };
}

interface NPC {
  id: string;
  name: string;
  sprite: string;
  x: number;
  y: number;
  room: number;
  dialogue: string[];
  currentDialogue: number;
  interactionCount: number;
}

interface PuzzleElement {
  id: string;
  type: "switch" | "rock" | "door" | "key" | "save_point" | "flower_bed";
  x: number;
  y: number;
  room: number;
  active: boolean;
  collected?: boolean;
}

const GameEngine = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentNPC, setCurrentNPC] = useState<NPC | null>(null);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState(0);
  const [gameMessage, setGameMessage] = useState("");

  const [gameState, setGameState] = useState<GameState>({
    scene: "menu",
    playerX: 320,
    playerY: 200,
    playerDirection: "down",
    playerSprite: 0,
    currentRoom: 0,
    playerName: "Frisk",
    inventory: [],
    gameProgress: {
      metFlowey: false,
      metToriel: false,
      foundKey: false,
      learnedAboutSave: false,
      completedPuzzle1: false,
    },
  });

  const [npcs, setNpcs] = useState<NPC[]>([
    {
      id: "flowey",
      name: "Флауи",
      sprite: "flowey",
      x: 304,
      y: 300,
      room: 0,
      dialogue: [
        "Привет! Я Флауи! Флауи-цветочек!",
        "Ты новенький в ПОДЗЕМЕЛЬЕ, не так ли?",
        "Кто-то должен научить тебя, как здесь все работает!",
        "Думаю, этим кем-то буду я.",
        "Готов? Вот мы и начинаем!",
        "Видишь это сердечко? Это твоя ДУША!",
        "Твоя ДУША начинает слабой, но может стать сильнее!",
        "Ты становишься сильнее через получение LV.",
        "Что означает LV? Почему, УРОВЕНЬ ЛЮБВИ, конечно!",
        "Хочешь немного ЛЮБВИ? Не волнуйся, я поделюсь!",
        "...На самом деле, знаешь что?",
        "Пройди дальше. Ты встретишь того, кто позаботится о тебе.",
      ],
      currentDialogue: 0,
      interactionCount: 0,
    },
    {
      id: "toriel",
      name: "Ториэль",
      sprite: "toriel",
      x: 304,
      y: 150,
      room: 1,
      dialogue: [
        "О! Дитя, ты ранено? Вставай, малыш.",
        "Не бойся, я Ториэль, хранительница РУИН.",
        "Я каждый день прохожу через это место, ища упавших людей.",
        "Пойдем! Я проведу тебя через катакомбы.",
        "Здесь много головоломок и ловушек.",
        "Я научу тебя, как решать их.",
        "Первый урок - некоторые переключатели активируются наступлением.",
        "Попробуй подойти к переключателю и нажать Z.",
        "Отлично! Ты быстро учишься, дитя.",
        "Этот дом был построен для людей вроде тебя.",
        "Каждая комната была спроектирована как урок.",
        "Но ты... ты другой. Ты понимаешь без объяснений.",
      ],
      currentDialogue: 0,
      interactionCount: 0,
    },
  ]);

  // Головоломки
  const [puzzleElements, setPuzzleElements] = useState<PuzzleElement[]>([
    // Комната 0 - Место падения
    {
      id: "save1",
      type: "save_point",
      x: 500,
      y: 350,
      room: 0,
      active: true,
    },
    {
      id: "flowers1",
      type: "flower_bed",
      x: 280,
      y: 400,
      room: 0,
      active: true,
    },
    // Комната 1 - Первая головоломка
    {
      id: "switch1",
      type: "switch",
      x: 150,
      y: 300,
      room: 1,
      active: false,
    },
    {
      id: "door1",
      type: "door",
      x: 304,
      y: 64,
      room: 1,
      active: false,
    },
    {
      id: "rock1",
      type: "rock",
      x: 450,
      y: 250,
      room: 1,
      active: true,
    },
    // Комната 2 - Дом Ториэль
    {
      id: "key1",
      type: "key",
      x: 200,
      y: 200,
      room: 2,
      active: true,
      collected: false,
    },
    {
      id: "save2",
      type: "save_point",
      x: 400,
      y: 300,
      room: 2,
      active: true,
    },
    // Комната 3 - Длинный коридор
    {
      id: "door2",
      type: "door",
      x: 304,
      y: 400,
      room: 3,
      active: false,
    },
  ]);

  const roomData = {
    0: { name: "Место падения", maxRooms: 4 },
    1: { name: "Первая головоломка", maxRooms: 4 },
    2: { name: "Дом Ториэль", maxRooms: 4 },
    3: { name: "Длинный коридор", maxRooms: 4 },
  };

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
        // Улучшенная вступительная сцена
        const gradient = ctx.createLinearGradient(0, 0, 0, 480);
        gradient.addColorStop(0, "#1a1a2e");
        gradient.addColorStop(0.5, "#16213e");
        gradient.addColorStop(1, "#0f0f23");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 640, 480);

        // Дыра с градиентом глубины
        const holeGradient = ctx.createRadialGradient(320, 50, 10, 320, 50, 60);
        holeGradient.addColorStop(0, "#000000");
        holeGradient.addColorStop(0.8, "#1a1a1a");
        holeGradient.addColorStop(1, "#2a2a2a");
        ctx.fillStyle = holeGradient;
        ctx.fillRect(280, 0, 80, 120);

        // Улучшенные золотые цветы
        for (let i = 0; i < 640; i += 50) {
          for (let j = 0; j < 3; j++) {
            const x = i + j * 15;
            const y = 420 + j * 8;
            // Лепестки
            drawPixelRect(ctx, x, y, 32, 24, "#FFD700");
            drawPixelRect(ctx, x + 4, y + 4, 24, 16, "#FFA500");
            // Центр
            drawPixelRect(ctx, x + 12, y + 8, 8, 8, "#FF8C00");
            // Стебель
            drawPixelRect(ctx, x + 14, y + 24, 4, 20, "#228B22");
            drawPixelRect(ctx, x + 10, y + 35, 12, 6, "#32CD32");
          }
        }
      } else if (
        scene === "ruins" ||
        scene === "home" ||
        scene === "corridor" ||
        scene === "garden"
      ) {
        // Базовый фон руин
        const bgGradient = ctx.createLinearGradient(0, 0, 0, 480);
        bgGradient.addColorStop(0, "#2D1B69");
        bgGradient.addColorStop(0.5, "#3D2B79");
        bgGradient.addColorStop(1, "#1D0B59");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, 640, 480);

        // Детализированные стены с кирпичной текстурой
        for (let i = 0; i < 640; i += 32) {
          // Верхняя стена
          drawPixelRect(ctx, i, 0, 32, 64, "#6A6A6A");
          drawPixelRect(ctx, i + 2, 2, 28, 60, "#5A5A5A");
          drawPixelRect(ctx, i + 4, 4, 24, 56, "#4A4A4A");

          // Кирпичная текстура
          for (let j = 0; j < 64; j += 8) {
            drawPixelRect(ctx, i + 6, j + 2, 20, 1, "#3A3A3A");
            drawPixelRect(ctx, i + 12, j + 6, 8, 1, "#7A7A7A");
          }

          // Нижняя стена
          drawPixelRect(ctx, i, 416, 32, 64, "#6A6A6A");
          drawPixelRect(ctx, i + 2, 418, 28, 60, "#5A5A5A");
        }

        // Боковые стены с деталями
        for (let i = 64; i < 416; i += 32) {
          drawPixelRect(ctx, 0, i, 64, 32, "#6A6A6A");
          drawPixelRect(ctx, 576, i, 64, 32, "#6A6A6A");
          // Трещины в стенах
          drawPixelRect(ctx, 32, i + 8, 2, 16, "#3A3A3A");
          drawPixelRect(ctx, 606, i + 12, 2, 12, "#3A3A3A");
        }

        // Улучшенный пол с узором
        for (let x = 64; x < 576; x += 64) {
          for (let y = 64; y < 416; y += 64) {
            // Основной пол
            drawPixelRect(ctx, x, y, 64, 64, "#3A2A5A");
            drawPixelRect(ctx, x + 4, y + 4, 56, 56, "#4A3A6A");

            // Декоративный узор
            drawPixelRect(ctx, x + 16, y + 16, 32, 32, "#5A4A7A");
            drawPixelRect(ctx, x + 24, y + 24, 16, 16, "#6A5A8A");

            // Точки на углах
            drawPixelRect(ctx, x + 8, y + 8, 4, 4, "#7A6A9A");
            drawPixelRect(ctx, x + 52, y + 8, 4, 4, "#7A6A9A");
            drawPixelRect(ctx, x + 8, y + 52, 4, 4, "#7A6A9A");
            drawPixelRect(ctx, x + 52, y + 52, 4, 4, "#7A6A9A");
          }
        }

        // Специфичные элементы для разных комнат
        if (room === 0) {
          // Место падения - проход вниз
          drawPixelRect(ctx, 304, 416, 32, 64, "#2D1B69");

          // Лучи света сверху
          const lightGradient = ctx.createLinearGradient(320, 0, 320, 200);
          lightGradient.addColorStop(0, "#FFFF9922");
          lightGradient.addColorStop(1, "#FFFF9900");
          ctx.fillStyle = lightGradient;
          ctx.fillRect(280, 0, 80, 200);
        } else if (room === 1) {
          // Первая головоломка - проходы вверх и вниз
          drawPixelRect(ctx, 304, 0, 32, 64, "#2D1B69");
          drawPixelRect(ctx, 304, 416, 32, 64, "#2D1B69");

          // Факелы на стенах
          drawPixelRect(ctx, 100, 150, 8, 20, "#8B4513");
          drawPixelRect(ctx, 96, 140, 16, 16, "#FF4500");
          drawPixelRect(ctx, 532, 150, 8, 20, "#8B4513");
          drawPixelRect(ctx, 528, 140, 16, 16, "#FF4500");
        } else if (room === 2) {
          // Дом Ториэль - уютная обстановка
          drawPixelRect(ctx, 304, 416, 32, 64, "#2D1B69");

          // Ковер
          drawPixelRect(ctx, 150, 200, 340, 200, "#8B0000");
          drawPixelRect(ctx, 160, 210, 320, 180, "#A0522D");

          // Камин
          drawPixelRect(ctx, 480, 100, 80, 120, "#696969");
          drawPixelRect(ctx, 490, 110, 60, 100, "#2F4F4F");
          drawPixelRect(ctx, 505, 190, 30, 20, "#FF4500");

          // Книжные полки
          drawPixelRect(ctx, 80, 100, 40, 200, "#8B4513");
          for (let i = 0; i < 180; i += 20) {
            drawPixelRect(
              ctx,
              85,
              105 + i,
              30,
              15,
              ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"][
                Math.floor(i / 20) % 4
              ],
            );
          }
        } else if (room === 3) {
          // Длинный коридор
          drawPixelRect(ctx, 304, 0, 32, 64, "#2D1B69");

          // Колонны
          for (let i = 120; i < 520; i += 100) {
            drawPixelRect(ctx, i, 100, 24, 280, "#808080");
            drawPixelRect(ctx, i + 4, 104, 16, 272, "#696969");
            drawPixelRect(ctx, i + 8, 108, 8, 264, "#A9A9A9");
          }
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
        setCurrentDialogueIndex(0);
        setDialogVisible(true);

        // Обновляем прогресс
        if (npc.id === "flowey" && !gameState.gameProgress.metFlowey) {
          setGameState((prev) => ({
            ...prev,
            gameProgress: { ...prev.gameProgress, metFlowey: true },
          }));
        }
        if (npc.id === "toriel" && !gameState.gameProgress.metToriel) {
          setGameState((prev) => ({
            ...prev,
            gameProgress: { ...prev.gameProgress, metToriel: true },
          }));
        }
        return;
      }
    }
  }, [
    gameState.playerX,
    gameState.playerY,
    gameState.currentRoom,
    gameState.gameProgress,
    npcs,
  ]);

  const checkPuzzleInteraction = useCallback(() => {
    const currentRoomPuzzles = puzzleElements.filter(
      (elem) => elem.room === gameState.currentRoom && !elem.collected,
    );

    for (const puzzle of currentRoomPuzzles) {
      const distance = Math.sqrt(
        Math.pow(gameState.playerX - puzzle.x, 2) +
          Math.pow(gameState.playerY - puzzle.y, 2),
      );

      if (distance < 30) {
        if (puzzle.type === "switch") {
          setPuzzleElements((prev) =>
            prev.map((elem) =>
              elem.id === puzzle.id ? { ...elem, active: !elem.active } : elem,
            ),
          );

          // Активируем связанные двери
          if (puzzle.id === "switch1") {
            setPuzzleElements((prev) =>
              prev.map((elem) =>
                elem.id === "door1" ? { ...elem, active: puzzle.active } : elem,
              ),
            );
          }
          return;
        } else if (puzzle.type === "key" && !puzzle.collected) {
          setPuzzleElements((prev) =>
            prev.map((elem) =>
              elem.id === puzzle.id ? { ...elem, collected: true } : elem,
            ),
          );
          setGameState((prev) => ({
            ...prev,
            inventory: [...prev.inventory, "Ключ от дома"],
            gameProgress: { ...prev.gameProgress, foundKey: true },
          }));
          setGameMessage("Вы нашли ключ от дома Ториэль!");
          setTimeout(() => setGameMessage(""), 3000);
          return;
        } else if (puzzle.type === "save_point") {
          setGameMessage("* (Цветочный аромат наполняет вас решимостью.)");
          setGameState((prev) => ({
            ...prev,
            gameProgress: { ...prev.gameProgress, learnedAboutSave: true },
          }));
          setTimeout(() => setGameMessage(""), 4000);
          return;
        }
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

      // Переходы между комнатами
      if (newY <= 64 && newX > 304 && newX < 336) {
        if (gameState.currentRoom === 1) {
          newRoom = 0;
          newY = 380;
        } else if (gameState.currentRoom === 3) {
          newRoom = 2;
          newY = 380;
        }
      }
    }
    if (keys.has("ArrowDown") || keys.has("s")) {
      newY = Math.min(400, newY + speed);
      newDirection = "down";
      moved = true;

      // Переходы между комнатами
      if (newY >= 400 && newX > 304 && newX < 336) {
        if (gameState.currentRoom === 0) {
          newRoom = 1;
          newY = 80;
        } else if (gameState.currentRoom === 1) {
          newRoom = 2;
          newY = 80;
        } else if (gameState.currentRoom === 2) {
          newRoom = 3;
          newY = 80;
        }
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

    // Обновление анимации спрайта
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
    const sceneType = gameState.currentRoom >= 2 ? "home" : "ruins";
    drawBackground(ctx, sceneType, gameState.currentRoom);

    if (
      gameState.scene === "ruins" ||
      gameState.scene === "intro" ||
      gameState.scene === "home"
    ) {
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

      {/* UI элементы */}
      {gameState.scene !== "menu" && (
        <div className="fixed top-4 left-4 text-white font-mono text-sm">
          <div className="bg-black bg-opacity-80 p-3 rounded border border-white">
            <p className="text-yellow-400 font-bold">
              {roomData[gameState.currentRoom as keyof typeof roomData]?.name ||
                "Неизвестная комната"}
            </p>
            <p>
              Комната: {gameState.currentRoom + 1}/
              {Object.keys(roomData).length}
            </p>
            {gameState.inventory.length > 0 && (
              <div className="mt-2">
                <p className="text-cyan-400">Инвентарь:</p>
                {gameState.inventory.map((item, index) => (
                  <p key={index} className="text-sm">
                    • {item}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Сообщения игры */}
      {gameMessage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white font-mono text-lg p-4 border-2 border-yellow-400 rounded max-w-md text-center">
          {gameMessage}
        </div>
      )}

      {gameState.scene === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
          <div className="text-8xl font-mono mb-8 text-yellow-400 animate-pulse">
            PIXlROOM ™
          </div>
          <div className="text-2xl font-mono mb-4 text-gray-300">
            Приключение в Подземелье
          </div>
          <div className="text-lg font-mono mb-8 text-gray-400 text-center max-w-md">
            Погрузитесь в историю о решимости, дружбе и выборе между милосердием
            и силой
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
          <div className="text-center font-mono animate-fade-in">
            <p className="text-3xl mb-6 text-yellow-400">Давным-давно...</p>
            <p className="text-xl mb-4">Два народа правили Землей:</p>
            <p className="text-xl mb-4">ЛЮДИ и МОНСТРЫ.</p>
            <p className="text-lg mb-6 text-gray-300">
              Однажды между ними разразилась война...
            </p>
            <p className="text-lg text-gray-400">
              Люди победили и заточили монстров под землей магическим барьером.
            </p>
          </div>
        </div>
      )}

      {/* Улучшенная система диалогов */}
      {dialogVisible && currentNPC && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-end justify-center z-50">
          <div className="w-full max-w-5xl mx-4 mb-4 bg-black border-4 border-white">
            <div className="flex">
              {/* Портрет персонажа */}
              <div className="w-40 h-40 bg-gray-800 border-r-4 border-white flex flex-col items-center justify-center">
                <div className="text-6xl mb-2">
                  {currentNPC.sprite === "flowey" ? "🌻" : "👑"}
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {currentNPC.interactionCount > 0 &&
                    `Встреча ${currentNPC.interactionCount + 1}`}
                </div>
              </div>

              {/* Диалог */}
              <div className="flex-1">
                <div className="bg-white text-black px-6 py-3 font-mono font-bold text-lg">
                  {currentNPC.name}
                </div>
                <div className="p-8 text-white font-mono text-xl leading-relaxed min-h-[140px]">
                  {currentNPC.dialogue[currentDialogueIndex]}

                  {/* Индикатор прогресса диалога */}
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      {currentDialogueIndex + 1} / {currentNPC.dialogue.length}
                    </div>
                    <div className="flex space-x-1">
                      {currentNPC.dialogue.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index <= currentDialogueIndex
                              ? "bg-yellow-400"
                              : "bg-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-900">
              <div className="text-gray-400 text-sm font-mono">
                {currentDialogueIndex < currentNPC.dialogue.length - 1
                  ? "Z - Продолжить"
                  : "Z - Закончить разговор"}
              </div>
              <button
                onClick={handleDialogComplete}
                className="text-yellow-400 font-mono text-xl animate-bounce"
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
