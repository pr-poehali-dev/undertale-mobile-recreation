import React, { useState } from "react";
import GameEngine from "@/components/GameEngine";
import MobileControls from "@/components/MobileControls";
import DialogSystem from "@/components/DialogSystem";

const Index = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessages] = useState([
    "Добро пожаловать в мир UNDERTALE!",
    "Это мир, где никого не нужно убивать.",
    "Каждый монстр имеет свою историю...",
    "Твой выбор определит судьбу всех.",
  ]);

  const handleMobileMove = (direction: "up" | "down" | "left" | "right") => {
    // Симулируем нажатие клавиш для мобильного управления
    const keyMap = {
      up: "ArrowUp",
      down: "ArrowDown",
      left: "ArrowLeft",
      right: "ArrowRight",
    };

    const event = new KeyboardEvent("keydown", { key: keyMap[direction] });
    window.dispatchEvent(event);

    setTimeout(() => {
      const upEvent = new KeyboardEvent("keyup", { key: keyMap[direction] });
      window.dispatchEvent(upEvent);
    }, 100);
  };

  const handleAction = () => {
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const handleDialogComplete = () => {
    setShowDialog(false);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Главная игра */}
      <GameEngine />

      {/* Мобильные контроллы */}
      <MobileControls
        onMove={handleMobileMove}
        onAction={handleAction}
        onCancel={handleCancel}
      />

      {/* Система диалогов */}
      <DialogSystem
        isVisible={showDialog}
        messages={dialogMessages}
        characterName="Система"
        onComplete={handleDialogComplete}
      />

      {/* Инструкции для ПК */}
      <div className="fixed top-4 left-4 text-white font-mono text-sm hidden md:block">
        <div className="bg-black bg-opacity-70 p-2 rounded">
          <p>WASD/Стрелки - движение</p>
          <p>Z - действие</p>
          <p>X - отмена</p>
        </div>
      </div>

      {/* Логотип в углу */}
      <div className="fixed top-4 right-4 text-yellow-400 font-mono font-bold text-xl hidden md:block">
        UNDERTALE
      </div>
    </div>
  );
};

export default Index;
