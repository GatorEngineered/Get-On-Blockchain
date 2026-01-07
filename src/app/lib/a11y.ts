// src/app/lib/a11y.ts
// Accessibility utilities

/**
 * Announce a message to screen readers via live region
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof window === 'undefined') return;

  const liveRegion = document.getElementById('live-announcements');
  if (!liveRegion) {
    console.warn('[A11y] Live region not found. Add <div id="live-announcements" aria-live="polite" /> to your layout.');
    return;
  }

  // Set the priority
  liveRegion.setAttribute('aria-live', priority);

  // Clear and set the message (triggers announcement)
  liveRegion.textContent = '';
  // Use setTimeout to ensure the DOM update is registered
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

/**
 * Focus on an element by ID
 * @param elementId - The ID of the element to focus
 */
export function focusElement(elementId: string): void {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (element) {
    // Make sure element is focusable
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    element.focus();
  }
}

/**
 * Trap focus within a container (for modals)
 * @param containerId - The ID of the container
 * @returns cleanup function
 */
export function trapFocus(containerId: string): () => void {
  if (typeof window === 'undefined') return () => {};

  const container = document.getElementById(containerId);
  if (!container) return () => {};

  const focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Handle Escape key press (for closing modals)
 * @param callback - Function to call when Escape is pressed
 * @returns cleanup function
 */
export function onEscapeKey(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get contrast ratio between two colors
 * @param color1 - First color in hex format (e.g., '#ffffff')
 * @param color2 - Second color in hex format (e.g., '#000000')
 * @returns contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param ratio - Contrast ratio
 * @param isLargeText - Whether the text is large (18pt+ or 14pt bold)
 * @returns true if meets AA standard
 */
export function meetsWCAGAA(ratio: number, isLargeText = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
