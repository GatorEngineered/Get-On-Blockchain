'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import styles from './EventsSettings.module.css';

interface Event {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  scanWindowStart: string;
  scanWindowEnd: string;
  pointsAwarded: number;
  code: string;
  isActive: boolean;
  status: 'active' | 'upcoming' | 'expired' | 'inactive';
  scanCount: number;
  createdAt: string;
}

interface EventsSettingsProps {
  merchantData: any;
}

export default function EventsSettings({ merchantData }: EventsSettingsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventDate: '',
    scanWindowStart: '',
    scanWindowEnd: '',
    pointsAwarded: 50,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await fetch('/api/merchant/events');
      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await res.json();
      setEvents(data.events || []);

      // Generate QR codes for all events
      const codes: { [key: string]: string } = {};
      for (const event of data.events || []) {
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(event.code, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 2,
            width: 300,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          codes[event.id] = qrCodeDataUrl;
        } catch (err) {
          console.error('Error generating QR code for event:', event.id, err);
        }
      }
      setQrCodes(codes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingEvent(null);
    setFormData({
      name: '',
      description: '',
      eventDate: '',
      scanWindowStart: '',
      scanWindowEnd: '',
      pointsAwarded: 50,
    });
    setShowModal(true);
    setError(null);
  }

  function openEditModal(event: Event) {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      eventDate: formatDateTimeLocal(event.eventDate),
      scanWindowStart: formatDateTimeLocal(event.scanWindowStart),
      scanWindowEnd: formatDateTimeLocal(event.scanWindowEnd),
      pointsAwarded: event.pointsAwarded,
    });
    setShowModal(true);
    setError(null);
  }

  function formatDateTimeLocal(isoString: string): string {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingEvent
        ? `/api/merchant/events/${editingEvent.id}`
        : '/api/merchant/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save event');
      }

      setSuccess(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
      setShowModal(false);
      fetchEvents();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/merchant/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      setSuccess(data.message || 'Event deleted successfully!');
      fetchEvents();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  }

  async function handleToggleActive(event: Event) {
    try {
      const res = await fetch(`/api/merchant/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !event.isActive }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update event');
      }

      setSuccess(`Event ${event.isActive ? 'deactivated' : 'activated'} successfully!`);
      fetchEvents();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  }

  async function downloadQRCode(event: Event) {
    const qrCodeDataUrl = qrCodes[event.id];
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `event-${event.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'upcoming':
        return styles.statusUpcoming;
      case 'expired':
        return styles.statusExpired;
      default:
        return styles.statusInactive;
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.title}>Event QR Codes</h2>
      <p className={styles.subtitle}>
        Create special QR codes for events that award bonus points to attendees
      </p>

      {/* Info Card */}
      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>How Event QR Codes Work</h4>
        <p className={styles.infoText}>
          Event QR codes are special one-time-use codes for your events. Members can scan
          the event QR code during the scan window to earn bonus points.
        </p>
        <ul className={styles.infoList}>
          <li>Each member can only scan an event QR code once</li>
          <li>Members can scan both your regular visit QR AND event QR on the same day</li>
          <li>QR codes only work within the scan window you set</li>
          <li>Points are awarded instantly upon scanning</li>
        </ul>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}

      {/* Header Actions */}
      <div className={styles.headerActions}>
        <button onClick={openCreateModal} className={styles.createButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className={styles.emptyStateTitle}>No events yet</p>
          <p>Create your first event QR code to reward attendees with bonus points.</p>
        </div>
      ) : (
        events.map((event) => (
          <div key={event.id} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <div>
                <h3 className={styles.eventTitle}>
                  {event.name}
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(event.status)}`} style={{ marginLeft: '0.75rem' }}>
                    {event.status}
                  </span>
                </h3>
                {event.description && (
                  <p className={styles.eventDescription}>{event.description}</p>
                )}
              </div>
              <div className={styles.eventActions}>
                <button
                  onClick={() => openEditModal(event)}
                  className={styles.actionButton}
                  disabled={event.status === 'expired'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(event)}
                  className={styles.actionButton}
                >
                  {event.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            <div className={styles.eventMeta}>
              <div className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.eventDate)}
              </div>
              <div className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scan Window: {formatTime(event.scanWindowStart)} - {formatTime(event.scanWindowEnd)}
              </div>
              <div className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                {event.pointsAwarded} points
              </div>
            </div>

            <div className={styles.qrCodeContainer}>
              {qrCodes[event.id] ? (
                <img
                  src={qrCodes[event.id]}
                  alt={`QR Code for ${event.name}`}
                  className={styles.qrCodeImage}
                />
              ) : (
                <div>QR code not available</div>
              )}
            </div>

            <div className={styles.eventStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Scans</span>
                <span className={styles.statValue}>{event.scanCount}</span>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={() => downloadQRCode(event)}
                  className={styles.actionButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingEvent ? 'Edit Event' : 'Create Event'}
              </h3>
              <button onClick={() => setShowModal(false)} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Event Name *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., VIP Tasting Night, Grand Opening"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    className={styles.formTextarea}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description for the event"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Scan Window Start *</label>
                    <input
                      type="datetime-local"
                      className={styles.formInput}
                      value={formData.scanWindowStart}
                      onChange={(e) => setFormData({ ...formData, scanWindowStart: e.target.value })}
                      required
                    />
                    <p className={styles.formHint}>When members can start scanning</p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Scan Window End *</label>
                    <input
                      type="datetime-local"
                      className={styles.formInput}
                      value={formData.scanWindowEnd}
                      onChange={(e) => setFormData({ ...formData, scanWindowEnd: e.target.value })}
                      required
                    />
                    <p className={styles.formHint}>When QR code expires</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Points to Award *</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={formData.pointsAwarded}
                    onChange={(e) => setFormData({ ...formData, pointsAwarded: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                  />
                  <p className={styles.formHint}>Bonus points members earn for attending</p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
