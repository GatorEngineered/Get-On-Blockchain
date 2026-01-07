// src/app/components/AccessibleModal.tsx
// WCAG 2.1 AA compliant modal dialog component

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  size?: 'sm' | 'md' | 'lg';
  labelledBy?: string;
  describedBy?: string;
}

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
  size = 'md',
  labelledBy,
  describedBy,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  const titleId = labelledBy || 'modal-title';
  const descId = describedBy || 'modal-description';

  // Focus trap within modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableSelector =
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelector);
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element in modal
      setTimeout(() => {
        const focusableSelector =
          'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(focusableSelector);
        firstFocusable?.focus();
      }, 50);
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Remove event listener
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '560px' },
    lg: { maxWidth: '720px' },
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        style={{
          background: '#ffffff',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: sizeClasses[size].maxWidth,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 9999,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Title */}
        <h2
          id={titleId}
          style={{
            margin: '0 0 0.5rem',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: '#111827',
            paddingRight: '2.5rem',
          }}
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p
            id={descId}
            style={{
              margin: '0 0 1.5rem',
              color: '#6b7280',
              fontSize: '0.95rem',
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );

  // Use portal to render at document body level
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

// Confirm Dialog variant
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      confirmBg: '#dc2626',
      confirmHover: '#b91c1c',
      icon: '⚠️',
    },
    warning: {
      confirmBg: '#f59e0b',
      confirmHover: '#d97706',
      icon: '⚠️',
    },
    info: {
      confirmBg: '#3b82f6',
      confirmHover: '#2563eb',
      icon: 'ℹ️',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">
          {styles.icon}
        </div>
        <p style={{ color: '#374151', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              minWidth: '100px',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              background: styles.confirmBg,
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              minWidth: '100px',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}
