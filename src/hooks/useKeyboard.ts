import { useRef, useEffect } from "react";

interface UseKeyboardProps {
  onKeyPress: (key: string) => void;
  onSpace: () => void;
  onEscape: () => void;
  isEnabled: boolean;
}

export const useKeyboard = ({
  onKeyPress,
  onSpace,
  onEscape,
  isEnabled,
}: UseKeyboardProps) => {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  // Global physical hardware keyboard listener (Desktop / DevTools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input modal (like pilot name) is active
      if (
        document.activeElement &&
        document.activeElement.tagName === "INPUT" &&
        document.activeElement !== hiddenInputRef.current
      ) {
        return;
      }

      if (!isEnabled) return;

      if (e.key === "Escape" || e.code === "Escape") {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        onSpace();
        return;
      }

      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        onKeyPress(char);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnabled, onKeyPress, onSpace, onEscape]);

  // Mobile virtual keyboard input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value || !isEnabled) {
      e.target.value = "";
      return;
    }

    // Process every typed character (supports swipe typing and single keypresses)
    for (let i = 0; i < value.length; i++) {
      const char = value[i].toUpperCase();
      if (char === " ") {
        onSpace();
      } else if (/^[A-Z]$/.test(char)) {
        onKeyPress(char);
      }
    }
    
    // Clear buffer after processing
    e.target.value = "";
  };

  const focusMobileKeyboard = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  };

  return {
    hiddenInputRef,
    handleInputChange,
    focusMobileKeyboard,
  };
};