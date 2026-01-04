'use client';

import React, { useState } from 'react';
import styles from './EmailMarketingSettings.module.css';

interface EmailMarketingSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
}

export default function EmailMarketingSettings({ merchantData, onUpdate }: EmailMarketingSettingsProps) {
  const [editing, setEditing] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(
    merchantData?.notificationEmail || merchantData?.loginEmail || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSave() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/merchant/notification-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update notification email');
      }

      const data = await res.json();
      setSuccess('Notification email updated successfully!');
      setEditing(false);

      // Update parent component
      onUpdate({ notificationEmail: data.notificationEmail });
    } catch (err: any) {
      setError(err.message || 'Failed to update notification email');
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setNotificationEmail(merchantData?.notificationEmail || merchantData?.loginEmail || '');
    setEditing(false);
    setError('');
  }

  return (
    <div>
      <h2 className={styles.title}>Email Marketing & Reports</h2>
      <p className={styles.subtitle}>
        Manage email preferences for platform updates and business reports
      </p>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Email Marketing Policy */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Email Marketing Policy</h3>
        <div className={styles.policyContent}>
          <p>
            As a GetOnBlockchain merchant, you will receive important communications to help you
            succeed with your loyalty program:
          </p>
          <ul className={styles.benefitsList}>
            <li>
              <strong>Monthly Business Reports:</strong> Detailed analytics on member engagement,
              points awarded, payouts, and growth trends
            </li>
            <li>
              <strong>Platform Updates:</strong> New features, improvements, and best practices for
              maximizing your loyalty program
            </li>
            <li>
              <strong>Billing & Payment Notifications:</strong> Subscription renewals, payment
              confirmations, and account alerts
            </li>
            <li>
              <strong>Support & Educational Content:</strong> Tips, case studies, and guides to help
              you engage more customers
            </li>
          </ul>
          <div className={styles.policyNote}>
            <p>
              We respect your inbox. You'll typically receive 2-4 emails per month. You can
              unsubscribe from marketing emails at any time while still receiving critical account
              and billing notifications.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Email */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Notification Email Address</h3>
            <p className={styles.cardDescription}>
              Where should we send your monthly reports and important updates?
            </p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className={styles.editButton}>
              Edit
            </button>
          )}
        </div>

        <div className={styles.emailSection}>
          {editing ? (
            <div className={styles.editForm}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="your@email.com"
                className={styles.input}
              />
              <p className={styles.hint}>
                Leave blank to use your login email ({merchantData?.loginEmail})
              </p>

              <div className={styles.buttonGroup}>
                <button onClick={handleSave} disabled={loading} className={styles.saveButton}>
                  {loading ? 'Saving...' : 'Save Email'}
                </button>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.currentEmail}>
              <div className={styles.emailDisplay}>
                {merchantData?.notificationEmail || merchantData?.loginEmail || 'Not set'}
              </div>
              {!merchantData?.notificationEmail && (
                <p className={styles.defaultNote}>Using your login email as default</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Reports Info */}
      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>What's Included in Monthly Reports?</h4>
        <div className={styles.reportsList}>
          <div className={styles.reportItem}>
            <div className={styles.reportIcon}>📊</div>
            <div className={styles.reportContent}>
              <div className={styles.reportName}>Member Growth</div>
              <div className={styles.reportDesc}>
                New signups, active members, and retention metrics
              </div>
            </div>
          </div>

          <div className={styles.reportItem}>
            <div className={styles.reportIcon}>🎁</div>
            <div className={styles.reportContent}>
              <div className={styles.reportName}>Rewards Activity</div>
              <div className={styles.reportDesc}>
                Points awarded, payouts claimed, and redemption rates
              </div>
            </div>
          </div>

          <div className={styles.reportItem}>
            <div className={styles.reportIcon}>💰</div>
            <div className={styles.reportContent}>
              <div className={styles.reportName}>Financial Summary</div>
              <div className={styles.reportDesc}>Total USDC paid out and cost per customer</div>
            </div>
          </div>

          <div className={styles.reportItem}>
            <div className={styles.reportIcon}>📈</div>
            <div className={styles.reportContent}>
              <div className={styles.reportName}>Engagement Insights</div>
              <div className={styles.reportDesc}>
                Visit frequency, tier progression, and loyalty trends
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Preferences Note */}
      <div className={styles.noteCard}>
        <p>
          <strong>Need to change your preferences?</strong> Contact our support team to adjust
          email frequency or content preferences. We're here to make sure you get the information
          you need without inbox overload.
        </p>
      </div>
    </div>
  );
}
