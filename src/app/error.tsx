'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth: '600px',
        background: 'white',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{
          fontSize: '2rem',
          color: '#dc2626',
          marginBottom: '1rem',
        }}>
          Something went wrong!
        </h1>
        <p style={{
          color: '#6b7280',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          We've been notified about this issue and are working on a fix.
          Please try again, or contact support if the problem persists.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-block',
            }}
          >
            Go home
          </a>
        </div>
        {error.digest && (
          <p style={{
            marginTop: '2rem',
            fontSize: '0.875rem',
            color: '#9ca3af',
          }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
