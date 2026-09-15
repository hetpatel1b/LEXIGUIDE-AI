import * as React from "react";

const FOCUSABLE_ELEMENTS = [
  "a[href]",
  "area[href]",
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
  "select:not([disabled]):not([aria-hidden])",
  "textarea:not([disabled]):not([aria-hidden])",
  "button:not([disabled]):not([aria-hidden])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  '[tabindex]:not([tabindex^="-"])',
].join(",");

export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  isActive: boolean = true
) {
  React.useEffect(() => {
    if (!isActive || !ref.current) return;

    const currentRef = ref.current;
    
    // Save previously focused element to restore it later
    const previousFocus = document.activeElement as HTMLElement | null;

    // Helper to get focusable nodes
    const getFocusableElements = () =>
      Array.from(
        currentRef.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS)
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          !el.getAttribute("aria-hidden") &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0
      );

    // Initial focus on the first focusable element or the container itself
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      currentRef.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === currentRef) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus
      if (previousFocus && typeof previousFocus.focus === "function") {
        // Use a short timeout to prevent focus jumping issues during unmounts
        setTimeout(() => previousFocus.focus(), 0);
      }
    };
  }, [isActive, ref]);
}
