'use client';

import React, { useState } from 'react';
import styles from './SupportSettings.module.css';

interface SupportSettingsProps {
  merchantData: any;
}

export default function SupportSettings({ merchantData }: SupportSettingsProps) {
  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/merchant/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send support request');
      }

      const data = await res.json();
      setSuccess(data.message);

      // Reset form
      setCategory('General');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send support request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className={styles.title}>Support</h2>
      <p className={styles.subtitle}>Get help from our support team</p>

      {error && <div className={styles.errorAlert}>{error}</div>}
      {success && <div className={styles.successAlert}>{success}</div>}

      {/* Merchant Context Info */}
      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>Your Account Information</h4>
        <p className={styles.infoText}>
          When you contact support, we'll automatically include this information to help us assist you
          faster:
        </p>
        <div className={styles.contextGrid}>
          <div className={styles.contextItem}>
            <span className={styles.contextLabel}>Business Name:</span>
            <span className={styles.contextValue}>{merchantData?.name || 'N/A'}</span>
          </div>
          <div className={styles.contextItem}>
            <span className={styles.contextLabel}>Account Email:</span>
            <span className={styles.contextValue}>{merchantData?.loginEmail || 'N/A'}</span>
          </div>
          <div className={styles.contextItem}>
            <span className={styles.contextLabel}>Merchant ID:</span>
            <span className={styles.contextValue}>{merchantData?.id || 'N/A'}</span>
          </div>
          <div className={styles.contextItem}>
            <span className={styles.contextLabel}>Current Plan:</span>
            <span className={styles.contextValue}>{merchantData?.plan || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Support Form */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Contact Support</h3>
        <p className={styles.cardDescription}>
          Fill out the form below and our team will respond within 24 hours (usually much faster!)
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Category */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
            >
              <option value="General">General Question</option>
              <option value="Billing">Billing & Payments</option>
              <option value="Technical">Technical Issue</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Payout">Payout & Wallet Issues</option>
              <option value="Members">Member Management</option>
              <option value="Integration">Integration & Setup</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Subject */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Subject <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue or question"
              className={styles.input}
              required
              minLength={5}
            />
          </div>

          {/* Message */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Message <span className={styles.required}>*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide as much detail as possible to help us assist you quickly..."
              className={styles.textarea}
              rows={8}
              required
              minLength={20}
            />
            <p className={styles.hint}>Minimum 20 characters</p>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Sending...' : 'Send Support Request'}
          </button>
        </form>
      </div>

      {/* Quick Help Resources */}
      <div className={styles.resourcesCard}>
        <h4 className={styles.resourcesTitle}>Quick Help Resources</h4>
        <div className={styles.resourcesList}>
          <a href="/docs/getting-started" className={styles.resourceItem}>
            <div className={styles.resourceIcon}>📘</div>
            <div className={styles.resourceContent}>
              <div className={styles.resourceName}>Getting Started Guide</div>
              <div className={styles.resourceDesc}>Learn the basics of setting up your loyalty program</div>
            </div>
          </a>

          <a href="/docs/members" className={styles.resourceItem}>
            <div className={styles.resourceIcon}>👥</div>
            <div className={styles.resourceContent}>
              <div className={styles.resourceName}>Member Management</div>
              <div className={styles.resourceDesc}>How to add, manage, and engage your members</div>
            </div>
          </a>

          <a href="/docs/payouts" className={styles.resourceItem}>
            <div className={styles.resourceIcon}>💰</div>
            <div className={styles.resourceContent}>
              <div className={styles.resourceName}>Payout System</div>
              <div className={styles.resourceDesc}>Understanding USDC payouts and wallet setup</div>
            </div>
          </a>

          <a href="/docs/faq" className={styles.resourceItem}>
            <div className={styles.resourceIcon}>❓</div>
            <div className={styles.resourceContent}>
              <div className={styles.resourceName}>FAQ</div>
              <div className={styles.resourceDesc}>Answers to commonly asked questions</div>
            </div>
          </a>
        </div>
      </div>

      {/* Contact Info */}
      <div className={styles.contactCard}>
        <h4 className={styles.contactTitle}>Other Ways to Reach Us</h4>
        <div className={styles.contactMethods}>
          <div className={styles.contactMethod}>
            <span className={styles.contactIcon}>📧</span>
            <div>
              <div className={styles.contactType}>Email</div>
              <a href="mailto:support@getonblockchain.com" className={styles.contactLink}>
                support@getonblockchain.com
              </a>
            </div>
          </div>

          <div className={styles.contactMethod}>
            <span className={styles.contactIcon}>💬</span>
            <div>
              <div className={styles.contactType}>Live Chat</div>
              <div className={styles.contactText}>Available Mon-Fri, 9AM-5PM EST</div>
            </div>
          </div>

          <div className={styles.contactMethod}>
            <span className={styles.contactIcon}>📞</span>
            <div>
              <div className={styles.contactType}>Priority Phone Support</div>
              <div className={styles.contactText}>Premium & Enterprise plans only</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
