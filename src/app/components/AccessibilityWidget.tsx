"use client";

import { useState, useEffect, useCallback } from "react";

interface AccessibilitySettings {
  fontSize: number; // 0 = normal, 1 = large, 2 = x-large
  highContrast: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  pauseAnimations: boolean;
  largeCursor: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 0,
  highContrast: false,
  highlightLinks: false,
  readableFont: false,
  pauseAnimations: false,
  largeCursor: false,
};

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("gob-accessibility");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        // Invalid JSON, use defaults
      }
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Font size
    const fontSizes = ["100%", "112.5%", "125%"];
    root.style.fontSize = fontSizes[settings.fontSize];

    // High contrast
    if (settings.highContrast) {
      root.classList.add("a11y-high-contrast");
    } else {
      root.classList.remove("a11y-high-contrast");
    }

    // Highlight links
    if (settings.highlightLinks) {
      root.classList.add("a11y-highlight-links");
    } else {
      root.classList.remove("a11y-highlight-links");
    }

    // Readable font (dyslexia-friendly)
    if (settings.readableFont) {
      root.classList.add("a11y-readable-font");
    } else {
      root.classList.remove("a11y-readable-font");
    }

    // Pause animations
    if (settings.pauseAnimations) {
      root.classList.add("a11y-pause-animations");
    } else {
      root.classList.remove("a11y-pause-animations");
    }

    // Large cursor
    if (settings.largeCursor) {
      root.classList.add("a11y-large-cursor");
    } else {
      root.classList.remove("a11y-large-cursor");
    }

    // Save to localStorage
    localStorage.setItem("gob-accessibility", JSON.stringify(settings));
  }, [settings, mounted]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetAll = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const cycleFontSize = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fontSize: (prev.fontSize + 1) % 3,
    }));
  }, []);

  if (!mounted) return null;

  const fontSizeLabels = ["Normal", "Large", "Extra Large"];

  return (
    <>
      {/* Accessibility CSS */}
      <style jsx global>{`
        .a11y-high-contrast {
          filter: contrast(1.25);
        }
        .a11y-high-contrast img,
        .a11y-high-contrast video {
          filter: contrast(0.8);
        }
        .a11y-highlight-links a {
          background-color: #ffff00 !important;
          color: #000000 !important;
          text-decoration: underline !important;
          padding: 2px 4px !important;
        }
        .a11y-readable-font,
        .a11y-readable-font * {
          font-family: Arial, Helvetica, sans-serif !important;
          letter-spacing: 0.05em !important;
          word-spacing: 0.1em !important;
          line-height: 1.8 !important;
        }
        .a11y-pause-animations *,
        .a11y-pause-animations *::before,
        .a11y-pause-animations *::after {
          animation-play-state: paused !important;
          transition: none !important;
        }
        .a11y-large-cursor,
        .a11y-large-cursor * {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M4 4 L4 28 L12 20 L18 28 L22 26 L16 18 L26 18 Z' fill='black' stroke='white' stroke-width='2'/%3E%3C/svg%3E")
              4 4,
            auto !important;
        }

        /* Widget Styles */
        .a11y-widget-trigger {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 9999;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #244b7a;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s, background 0.2s;
        }
        .a11y-widget-trigger:hover {
          background: #1a3a5c;
          transform: scale(1.05);
        }
        .a11y-widget-trigger:focus {
          outline: 3px solid #fbbf24;
          outline-offset: 2px;
        }
        .a11y-widget-trigger svg {
          width: 28px;
          height: 28px;
        }

        .a11y-widget-panel {
          position: fixed;
          bottom: 88px;
          left: 20px;
          z-index: 9998;
          width: 320px;
          max-height: calc(100vh - 120px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          animation: a11y-slide-up 0.2s ease-out;
        }

        @keyframes a11y-slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .a11y-widget-header {
          padding: 1rem 1.25rem;
          background: #244b7a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .a11y-widget-header h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        .a11y-widget-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .a11y-widget-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .a11y-widget-close:focus {
          outline: 2px solid white;
          outline-offset: 2px;
        }

        .a11y-widget-body {
          padding: 1rem;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }

        .a11y-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          margin-bottom: 0.5rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .a11y-option:hover {
          background: #f3f4f6;
        }
        .a11y-option:focus-within {
          outline: 2px solid #244b7a;
          outline-offset: 2px;
        }
        .a11y-option-active {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .a11y-option-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .a11y-option-label svg {
          width: 20px;
          height: 20px;
          color: #6b7280;
        }
        .a11y-option-active .a11y-option-label svg {
          color: #3b82f6;
        }
        .a11y-option-text {
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
        }
        .a11y-option-active .a11y-option-text {
          color: #1d4ed8;
        }

        .a11y-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          background: #d1d5db;
          border-radius: 12px;
          transition: background 0.2s;
        }
        .a11y-toggle-active {
          background: #3b82f6;
        }
        .a11y-toggle::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .a11y-toggle-active::after {
          transform: translateX(20px);
        }

        .a11y-font-size-value {
          font-size: 0.8rem;
          color: #6b7280;
          padding: 4px 8px;
          background: #e5e7eb;
          border-radius: 4px;
        }
        .a11y-option-active .a11y-font-size-value {
          background: #3b82f6;
          color: white;
        }

        .a11y-widget-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .a11y-reset-btn {
          background: none;
          border: 1px solid #d1d5db;
          color: #6b7280;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .a11y-reset-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }
        .a11y-reset-btn:focus {
          outline: 2px solid #244b7a;
          outline-offset: 2px;
        }
        .a11y-link {
          font-size: 0.8rem;
          color: #244b7a;
          text-decoration: none;
        }
        .a11y-link:hover {
          text-decoration: underline;
        }

        /* Backdrop for mobile */
        .a11y-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 9997;
        }

        @media (max-width: 400px) {
          .a11y-widget-panel {
            left: 10px;
            right: 10px;
            width: auto;
            bottom: 80px;
          }
          .a11y-widget-trigger {
            left: 10px;
            bottom: 10px;
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      {/* Backdrop when panel is open (mobile) */}
      {isOpen && (
        <div
          className="a11y-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Widget Panel */}
      {isOpen && (
        <div
          className="a11y-widget-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-widget-title"
        >
          <div className="a11y-widget-header">
            <h2 id="a11y-widget-title">Accessibility Options</h2>
            <button
              className="a11y-widget-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility options"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="a11y-widget-body">
            {/* Font Size */}
            <button
              className={`a11y-option ${settings.fontSize > 0 ? "a11y-option-active" : ""}`}
              onClick={cycleFontSize}
              aria-pressed={settings.fontSize > 0}
            >
              <span className="a11y-option-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="a11y-option-text">Text Size</span>
              </span>
              <span className="a11y-font-size-value">{fontSizeLabels[settings.fontSize]}</span>
            </button>

            {/* High Contrast */}
            <button
              className={`a11y-option ${settings.highContrast ? "a11y-option-active" : ""}`}
              onClick={() => updateSetting("highContrast", !settings.highContrast)}
              aria-pressed={settings.highContrast}
            >
              <span className="a11y-option-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v20" />
                  <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" />
                </svg>
                <span className="a11y-option-text">High Contrast</span>
              </span>
              <span className={`a11y-toggle ${settings.highContrast ? "a11y-toggle-active" : ""}`} aria-hidden="true" />
            </button>

            {/* Highlight Links */}
            <button
              className={`a11y-option ${settings.highlightLinks ? "a11y-option-active" : ""}`}
              onClick={() => updateSetting("highlightLinks", !settings.highlightLinks)}
              aria-pressed={settings.highlightLinks}
            >
              <span className="a11y-option-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="a11y-option-text">Highlight Links</span>
              </span>
              <span className={`a11y-toggle ${settings.highlightLinks ? "a11y-toggle-active" : ""}`} aria-hidden="true" />
            </button>

            {/* Readable Font */}
            <button
              className={`a11y-option ${settings.readableFont ? "a11y-option-active" : ""}`}
              onClick={() => updateSetting("readableFont", !settings.readableFont)}
              aria-pressed={settings.readableFont}
            >
              <span className="a11y-option-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="a11y-option-text">Readable Font</span>
              </span>
              <span className={`a11y-toggle ${settings.readableFont ? "a11y-toggle-active" : ""}`} aria-hidden="true" />
            </button>

            {/* Pause Animations */}
            <button
              className={`a11y-option ${settings.pauseAnimations ? "a11y-option-active" : ""}`}
              onClick={() => updateSetting("pauseAnimations", !settings.pauseAnimations)}
              aria-pressed={settings.pauseAnimations}
            >
              <span className="a11y-option-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span className="a11y-option-text">Pause Animations</span>
              </span>
              <span className={`a11y-toggle ${settings.pauseAnimations ? "a11y-toggle-active" : ""}`} aria-hidden="true" />
            </button>

            {/* Large Cursor */}
            <button
              className={`a11y-option ${settings.largeCursor ? "a11y-option-active" : ""}`}
              onClick={() => updateSetting("largeCursor", !settings.largeCursor)}
              aria-pressed={settings.largeCursor}
            >
              <span className="a11y-option-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4L4 20L10 14L14 20L17 18.5L13 12.5L20 12.5L4 4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="a11y-option-text">Large Cursor</span>
              </span>
              <span className={`a11y-toggle ${settings.largeCursor ? "a11y-toggle-active" : ""}`} aria-hidden="true" />
            </button>
          </div>

          <div className="a11y-widget-footer">
            <button className="a11y-reset-btn" onClick={resetAll}>
              Reset All
            </button>
            <a href="/accessibility" className="a11y-link">
              Accessibility Statement
            </a>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        className="a11y-widget-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close accessibility options" : "Open accessibility options"}
        aria-expanded={isOpen}
        aria-controls="a11y-widget-panel"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z" />
        </svg>
      </button>
    </>
  );
}
