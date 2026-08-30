import React, { useCallback } from "react";

interface OnScreenKeyboardProps {
  onKeyPress: (char: string) => void;
  onEmpClick: () => void;
  bombs: number;
}

const ROW_1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const ROW_2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const ROW_3 = ["Z", "X", "C", "V", "B", "N", "M"];

export const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  onKeyPress,
  onEmpClick,
  bombs,
}) => {
  const handleKeyTouch = useCallback(
    (char: string, e: React.PointerEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onKeyPress(char);
    },
    [onKeyPress]
  );

  const handleEmpTouch = useCallback(
    (e: React.PointerEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (bombs > 0) {
        onEmpClick();
      }
    },
    [bombs, onEmpClick]
  );

  return (
    <div className="ztype-keyboard-container">
      {/* Top divider line */}
      <div className="ztype-keyboard-divider" />

      <div className="ztype-keyboard-body">
        {/* Row 1 */}
        <div className="ztype-kb-row">
          {ROW_1.map((char) => (
            <button
              key={char}
              type="button"
              className="ztype-key"
              onPointerDown={(e) => handleKeyTouch(char, e)}
            >
              {char}
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="ztype-kb-row row-mid">
          {ROW_2.map((char) => (
            <button
              key={char}
              type="button"
              className="ztype-key"
              onPointerDown={(e) => handleKeyTouch(char, e)}
            >
              {char}
            </button>
          ))}
        </div>

        {/* Row 3 (Properly spaced across full row) */}
        <div className="ztype-kb-row row-bottom">
          {ROW_3.map((char) => (
            <button
              key={char}
              type="button"
              className="ztype-key"
              onPointerDown={(e) => handleKeyTouch(char, e)}
            >
              {char}
            </button>
          ))}
        </div>

        {/* Full Size Bottom SPACEBAR / EMP BLAST Button */}
        <div className="ztype-kb-row row-spacebar">
          <button
            type="button"
            className={`ztype-space-btn ${bombs > 0 ? "emp-ready" : "emp-empty"}`}
            onPointerDown={handleEmpTouch}
            disabled={bombs === 0}
          >
            ⚡ SPACE — EMP BLAST ({bombs}) ⚡
          </button>
        </div>
      </div>
    </div>
  );
};