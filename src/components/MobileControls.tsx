import React from "react";
import Icon from "@/components/ui/icon";

interface MobileControlsProps {
  onMove: (direction: "up" | "down" | "left" | "right") => void;
  onAction: () => void;
  onCancel: () => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onAction,
  onCancel,
}) => {
  const handleTouchStart =
    (direction: "up" | "down" | "left" | "right") => (e: React.TouchEvent) => {
      e.preventDefault();
      onMove(direction);
    };

  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-between px-4 md:hidden">
      {/* D-pad */}
      <div className="relative w-32 h-32">
        {/* Up */}
        <button
          onTouchStart={handleTouchStart("up")}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-white bg-opacity-20 border border-white rounded flex items-center justify-center"
        >
          <Icon name="ChevronUp" size={20} className="text-white" />
        </button>

        {/* Down */}
        <button
          onTouchStart={handleTouchStart("down")}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-white bg-opacity-20 border border-white rounded flex items-center justify-center"
        >
          <Icon name="ChevronDown" size={20} className="text-white" />
        </button>

        {/* Left */}
        <button
          onTouchStart={handleTouchStart("left")}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-20 border border-white rounded flex items-center justify-center"
        >
          <Icon name="ChevronLeft" size={20} className="text-white" />
        </button>

        {/* Right */}
        <button
          onTouchStart={handleTouchStart("right")}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-20 border border-white rounded flex items-center justify-center"
        >
          <Icon name="ChevronRight" size={20} className="text-white" />
        </button>

        {/* Center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white bg-opacity-10 rounded-full"></div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onAction();
          }}
          className="w-12 h-12 bg-yellow-500 bg-opacity-80 border border-yellow-300 rounded-full flex items-center justify-center font-mono text-black font-bold"
        >
          Z
        </button>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onCancel();
          }}
          className="w-12 h-12 bg-red-500 bg-opacity-80 border border-red-300 rounded-full flex items-center justify-center font-mono text-white font-bold"
        >
          X
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
