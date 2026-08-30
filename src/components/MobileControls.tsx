import React from "react";

interface MobileControlsProps {
  hiddenInputRef: React.RefObject<HTMLInputElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmpClick: () => void;
  bombs: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  hiddenInputRef,
  handleInputChange,
  onEmpClick,
  bombs,
}) => {
  const triggerFocus = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  };

  return (
    <div className="mobile-touch-bar">
      <div 
        className="mobile-kb-wrapper" 
        onClick={triggerFocus}
        onPointerDown={triggerFocus}
      >
        {/* type="search" & autocomplete="off" strips out the key, card, and location manager icons */}
        <input
          ref={hiddenInputRef}
          type="search"
          name="game_search_stream"
          inputMode="search"
          className="mobile-real-input"
          onChange={handleInputChange}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Mobile Typing Stream"
        />
        <div className="mobile-kb-btn">
          ⌨️ TAP TO TYPE
        </div>
      </div>

      <button
        type="button"
        className={`mobile-emp-btn ${bombs > 0 ? "active" : "disabled"}`}
        onClick={(e) => {
          e.stopPropagation();
          onEmpClick();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (bombs > 0) onEmpClick();
        }}
        disabled={bombs === 0}
      >
        ⚡ EMP ({bombs})
      </button>
    </div>
  );
};