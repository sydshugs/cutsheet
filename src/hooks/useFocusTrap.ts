// useFocusTrap.ts — Traps focus within a container while active
import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Remember what was focused before the trap
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus when trap deactivates
      previousFocusRef.current?.focus();
    };
  }, [active]);

  return containerRef;
}
