import { useState } from "react";

export function useSheet(onClose: () => void) {
  const [closing, setClosing] = useState(false);

  function close(cb?: () => void) {
    setClosing(true);
    setTimeout(cb ?? onClose, 260);
  }

  const panelClass = closing ? "animate-slide-down" : "animate-slide-up";
  const backdropClass = closing ? "animate-fade-out" : "animate-fade-in";

  return { closing, close, panelClass, backdropClass };
}
