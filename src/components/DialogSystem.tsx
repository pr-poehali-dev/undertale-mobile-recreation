import React, { useState, useEffect } from "react";

interface DialogSystemProps {
  isVisible: boolean;
  messages: string[];
  characterName?: string;
  onComplete: () => void;
}

const DialogSystem: React.FC<DialogSystemProps> = ({
  isVisible,
  messages,
  characterName,
  onComplete,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isVisible || messages.length === 0) return;

    const currentMessage = messages[currentMessageIndex];
    setIsTyping(true);
    setDisplayedText("");

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < currentMessage.length) {
        setDisplayedText(currentMessage.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50); // Скорость печати

    return () => clearInterval(typingInterval);
  }, [currentMessageIndex, messages, isVisible]);

  const handleNext = () => {
    if (isTyping) {
      // Если текст еще печатается, показать весь текст сразу
      setDisplayedText(messages[currentMessageIndex]);
      setIsTyping(false);
    } else if (currentMessageIndex < messages.length - 1) {
      // Перейти к следующему сообщению
      setCurrentMessageIndex((prev) => prev + 1);
    } else {
      // Закрыть диалог
      onComplete();
      setCurrentMessageIndex(0);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-center z-50">
      <div className="w-full max-w-2xl mx-4 mb-4 bg-black border-4 border-white">
        {/* Имя персонажа */}
        {characterName && (
          <div className="bg-white text-black px-4 py-2 font-mono font-bold">
            {characterName}
          </div>
        )}

        {/* Текст диалога */}
        <div className="p-6 text-white font-mono text-lg leading-relaxed min-h-[120px]">
          {displayedText}
          {isTyping && <span className="animate-pulse">|</span>}
        </div>

        {/* Индикатор продолжения */}
        <div className="flex justify-end p-4">
          <button
            onClick={handleNext}
            className="text-yellow-400 font-mono animate-bounce"
          >
            {currentMessageIndex < messages.length - 1 ? "▼" : "✓"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogSystem;
