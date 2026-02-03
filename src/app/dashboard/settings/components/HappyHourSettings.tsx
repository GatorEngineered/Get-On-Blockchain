'use client';

import React, { useState, useEffect } from 'react';
import styles from './HappyHourSettings.module.css';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

interface HappyHourSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

export default function HappyHourSettings({ merchantData, onUpdate }: HappyHourSettingsProps) {
  const [enabled, setEnabled] = useState(merchantData?.happyHourEnabled ?? false);
  const [multiplier, setMultiplier] = useState(merchantData?.happyHourMultiplier ?? 2);
  const [startTime, setStartTime] = useState(merchantData?.happyHourStartTime ?? '14:00');
  const [endTime, setEndTime] = useState(merchantData?.happyHourEndTime ?? '17:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    merchantData?.happyHourDaysOfWeek ?? [1, 2, 3, 4, 5]
  );
  const [timezone, setTimezone] = useState(
    merchantData?.happyHourTimezone ?? 'America/Los_Angeles'
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Update state when merchantData changes
  useEffect(() => {
    if (merchantData) {
      setEnabled(merchantData.happyHourEnabled ?? false);
      setMultiplier(merchantData.happyHourMultiplier ?? 2);
      setStartTime(merchantData.happyHourStartTime ?? '14:00');
      setEndTime(merchantData.happyHourEndTime ?? '17:00');
      setDaysOfWeek(merchantData.happyHourDaysOfWeek ?? [1, 2, 3, 4, 5]);
      setTimezone(merchantData.happyHourTimezone ?? 'America/Los_Angeles');
    }
  }, [merchantData]);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/merchant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          happyHourEnabled: enabled,
          happyHourMultiplier: multiplier,
          happyHourStartTime: startTime,
          happyHourEndTime: endTime,
          happyHourDaysOfWeek: daysOfWeek,
          happyHourTimezone: timezone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Happy Hour settings saved!');
      onUpdate({
        ...merchantData,
        happyHourEnabled: enabled,
        happyHourMultiplier: multiplier,
        happyHourStartTime: startTime,
        happyHourEndTime: endTime,
        happyHourDaysOfWeek: daysOfWeek,
        happyHourTimezone: timezone,
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Format time to 12-hour format
  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Format days for preview
  const formatDays = () => {
    if (daysOfWeek.length === 7) return 'every day';
    if (daysOfWeek.length === 0) return 'no days selected';
    return daysOfWeek
      .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
      .join(', ');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className={styles.title}>Happy Hour</h2>
          <p className={styles.subtitle}>
            Boost member engagement by offering multiplied points during specific times
          </p>
        </div>
      </div>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Enable Toggle */}
      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <label className={styles.settingLabel}>Enable Happy Hour</label>
          <p className={styles.settingDesc}>
            Members earn bonus points when scanning during happy hour
          </p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`${styles.toggle} ${enabled ? styles.toggleOn : ''}`}
        >
          <span className={styles.toggleKnob} />
        </button>
      </div>

      {enabled && (
        <>
          {/* Multiplier */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Points Multiplier</label>
              <p className={styles.settingDesc}>
                How many times the regular points (e.g., 2x = double points)
              </p>
            </div>
            <div className={styles.multiplierInput}>
              <input
                type="number"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1)}
                min="1"
                max="10"
                step="0.5"
              />
              <span>x</span>
            </div>
          </div>

          {/* Time Window */}
          <div className={styles.timeSection}>
            <label className={styles.settingLabel}>Time Window</label>
            <div className={styles.timeRow}>
              <div className={styles.timeInput}>
                <label>Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <span className={styles.timeSeparator}>to</span>
              <div className={styles.timeInput}>
                <label>End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <label className={styles.settingLabel}>Timezone</label>
              <p className={styles.settingDesc}>Happy hour times are based on this timezone</p>
            </div>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={styles.select}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Days of Week */}
          <div className={styles.daysSection}>
            <label className={styles.settingLabel}>Active Days</label>
            <div className={styles.daysGrid}>
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`${styles.dayButton} ${
                    daysOfWeek.includes(day.value) ? styles.dayActive : ''
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={styles.preview}>
            <div className={styles.previewIcon}>
              <span>🎉</span>
            </div>
            <div className={styles.previewText}>
              <strong>Preview:</strong> Members earn{' '}
              <strong className={styles.highlight}>{multiplier}x points</strong> from{' '}
              <strong>{formatTime12Hour(startTime)}</strong> to <strong>{formatTime12Hour(endTime)}</strong> on{' '}
              <strong>{formatDays()}</strong>
            </div>
          </div>
        </>
      )}

      <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
        {saving ? 'Saving...' : 'Save Happy Hour Settings'}
      </button>
    </div>
  );
}
