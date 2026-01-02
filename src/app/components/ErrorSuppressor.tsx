'use client';

import { useEffect } from 'react';

/**
 * Suppresses annoying browser extension errors in development
 * These errors are caused by wallet extensions (MetaMask, Coinbase, etc.)
 * trying to inject scripts into the page
 */
export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress browser extension errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';

      // Filter out known extension errors
      const extensionErrors = [
        'chrome.runtime.sendMessage',
        'chrome-extension://',
        'Extension context invalidated',
        'Attempting to use a disconnected port',
      ];

      const shouldSuppress = extensionErrors.some(pattern =>
        errorMessage.includes(pattern)
      );

      if (!shouldSuppress) {
        originalError.apply(console, args);
      }
    };

    // Also suppress unhandled promise rejections from extensions
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      const extensionErrors = [
        'chrome.runtime.sendMessage',
        'chrome-extension://',
        'Extension context invalidated',
      ];

      if (extensionErrors.some(pattern => reason.includes(pattern))) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
