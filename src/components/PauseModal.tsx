import React from "react";

interface PauseModalProps {
  onResume: () => void;
  onExitToSetup: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onExitToSetup,
}) => {
  return (
    <div className="game-modal-overlay">
      <div className="game-modal">
        <h1 className="game-pause-title">PAUSED</h1>
        <p className="final-score">PRESS [ESC] OR CLICK RESUME</p>
        <div className="pause-actions">
          <button className="game-btn" onClick={onResume}>
            RESUME
          </button>
          <button className="game-btn-secondary" onClick={onExitToSetup}>
            MISSION SETUP
          </button>
        </div>
      </div>
    </div>
  );
};