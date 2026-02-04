'use client';

import React, { useState, useEffect } from 'react';

type EmailType = 'PROMOTIONAL' | 'ANNOUNCEMENT' | 'POINTS_UPDATE';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  memberIds?: string[]; // If provided, send to specific members. If not, show "all members" option
  memberName?: string; // For display when sending to single member
  onSuccess?: () => void;
};

const EMAIL_TYPES: { value: EmailType; label: string; description: string }[] = [
  {
    value: 'ANNOUNCEMENT',
    label: 'Business Announcement',
    description: 'General updates about your business, hours, events, etc.',
  },
  {
    value: 'PROMOTIONAL',
    label: 'Promotional Offer',
    description: 'Special deals, discounts, and limited-time offers.',
  },
  {
    value: 'POINTS_UPDATE',
    label: 'Points Update',
    description: 'Updates about points balances, tier status, or rewards.',
  },
];

export default function SendAnnouncementModal({
  isOpen,
  onClose,
  memberIds,
  memberName,
  onSuccess,
}: Props) {
  const [emailType, setEmailType] = useState<EmailType>('ANNOUNCEMENT');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const isSingleMember = memberIds && memberIds.length === 1;
  const sendToAll = !memberIds;

  // Fetch eligible recipient count when email type changes
  useEffect(() => {
    if (!isOpen || isSingleMember) return;

    async function fetchEligibleCount() {
      setLoadingCount(true);
      try {
        const res = await fetch(`/api/merchant/announcements?emailType=${emailType}`);
        if (res.ok) {
          const data = await res.json();
          setEligibleCount(data.eligibleCount);
        }
      } catch (err) {
        console.error('Failed to fetch eligible count:', err);
      } finally {
        setLoadingCount(false);
      }
    }

    fetchEligibleCount();
  }, [isOpen, emailType, isSingleMember]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmailType('ANNOUNCEMENT');
      setSubject('');
      setMessageBody('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  async function handleSend() {
    if (!subject.trim()) {
      setError('Please enter a subject line');
      return;
    }
    if (!messageBody.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/merchant/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType,
          subject,
          messageBody,
          memberIds: memberIds || undefined,
          sendToAll: sendToAll,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send announcement');
      }

      setSuccess(data.message);
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 2rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
              Send Message
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {isSingleMember
                ? `To: ${memberName || 'Selected member'}`
                : sendToAll
                ? 'To all opted-in members'
                : `To ${memberIds?.length} selected member${memberIds?.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close announcement dialog"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: '#9ca3af',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {/* Error/Success Messages */}
          {error && (
            <div
              style={{
                padding: '0.875rem 1rem',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: '0.875rem 1rem',
                background: '#d1fae5',
                border: '1px solid #6ee7b7',
                borderRadius: '8px',
                color: '#065f46',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              {success}
            </div>
          )}

          {/* Email Type Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem',
              }}
            >
              Message Type
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {EMAIL_TYPES.map((type) => (
                <label
                  key={type.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    border: `2px solid ${emailType === type.value ? '#244b7a' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: emailType === type.value ? '#f0f5ff' : 'white',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="emailType"
                    value={type.value}
                    checked={emailType === type.value}
                    onChange={(e) => setEmailType(e.target.value as EmailType)}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>
                      {type.label}
                    </span>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {!isSingleMember && (
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.8rem',
                  color: '#6b7280',
                  fontStyle: 'italic',
                }}
              >
                {loadingCount
                  ? 'Checking eligible recipients...'
                  : eligibleCount !== null
                  ? `${eligibleCount} member${eligibleCount !== 1 ? 's' : ''} opted in for this type`
                  : ''}
              </p>
            )}
          </div>

          {/* Subject Line */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem',
              }}
            >
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., New Spring Menu Now Available!"
              maxLength={100}
              disabled={sending}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>
              {subject.length}/100
            </p>
          </div>

          {/* Message Body */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem',
              }}
            >
              Message
            </label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Write your message here. This will be sent via Get On Blockchain with your business name and our platform branding."
              rows={6}
              maxLength={2000}
              disabled={sending}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.95rem',
                resize: 'vertical',
                minHeight: '120px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>
              {messageBody.length}/2000
            </p>
          </div>

          {/* Info Box */}
          <div
            style={{
              padding: '1rem',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div style={{ fontSize: '0.8rem', color: '#0c4a6e', lineHeight: 1.5 }}>
                <strong>Email Privacy:</strong> Your message will be sent through Get On Blockchain.
                Member email addresses are kept private. Emails include an unsubscribe link and
                comply with CAN-SPAM regulations.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 2rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={sending}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !messageBody.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              background: sending || !subject.trim() || !messageBody.trim() ? '#d1d5db' : '#244b7a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: sending || !subject.trim() || !messageBody.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {sending ? (
              <>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Sending...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Message
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
