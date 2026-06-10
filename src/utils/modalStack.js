/**
 * modalStack.js
 * Utility to manage the stack of open modals and close the topmost modal on Escape key press.
 */

if (typeof window !== "undefined") {
  window._modalStack = window._modalStack || [];
  
  // Register global keydown listener once
  if (!window._modalListenerRegistered) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const stack = window._modalStack || [];
        if (stack.length > 0) {
          const topmostClose = stack[stack.length - 1];
          topmostClose();
        }
      }
    });
    window._modalListenerRegistered = true;
  }
}

export function registerModal(onClose) {
  if (typeof window === "undefined" || !onClose) return () => {};
  
  window._modalStack = window._modalStack || [];
  window._modalStack.push(onClose);
  
  return () => {
    window._modalStack = (window._modalStack || []).filter(cb => cb !== onClose);
  };
}
