'use client';

import React, { useState } from 'react';
import styles from './AccountSettings.module.css';

interface AccountSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
  onRefresh: () => void;
}

export default function AccountSettings({ merchantData, onUpdate, onRefresh }: AccountSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Business Name Edit State
  const [editingBusinessName, setEditingBusinessName] = useState(false);
  const [businessName, setBusinessName] = useState(merchantData?.name || '');

  // Email Edit State
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(merchantData?.loginEmail || '');

  // Password Change State
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Main Address Edit State
  const [editingAddress, setEditingAddress] = useState(false);
  const [mainAddress, setMainAddress] = useState(merchantData?.mainBusiness?.address || '');

  // Multi-location State
  const [addingLocation, setAddingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    nickname: '',
    address: '',
  });

  async function handleUpdateBusinessName() {
    if (!businessName.trim()) {
      setError('Business name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/merchant/update-business-name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update business name');
      }

      setSuccess('Business name updated successfully');
      setEditingBusinessName(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEmail() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/merchant/update-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update email');
      }

      setSuccess('Email updated successfully');
      setEditingEmail(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/merchant/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateMainAddress() {
    if (!mainAddress.trim()) {
      setError('Address cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/merchant/update-main-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: mainAddress }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update address');
      }

      setSuccess('Main address updated successfully');
      setEditingAddress(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLocation() {
    if (!locationForm.name || !locationForm.address) {
      setError('Location name and address are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/merchant/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add location');
      }

      setSuccess('Location added successfully');
      setAddingLocation(false);
      setLocationForm({ name: '', nickname: '', address: '' });
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLocation(locationId: string) {
    if (!locationForm.name || !locationForm.address) {
      setError('Location name and address are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/merchant/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update location');
      }

      setSuccess('Location updated successfully');
      setEditingLocationId(null);
      setLocationForm({ name: '', nickname: '', address: '' });
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLocation(locationId: string) {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/merchant/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete location');
      }

      setSuccess('Location deleted successfully');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditLocation(location: any) {
    setEditingLocationId(location.id);
    setLocationForm({
      name: location.name,
      nickname: location.locationNickname || '',
      address: location.address,
    });
  }

  if (!merchantData) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Account Settings</h2>
      <p className={styles.sectionDescription}>
        Manage your business information and credentials
      </p>

      {/* Alert Messages */}
      {error && (
        <div className={styles.alert} style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ color: '#991b1b' }}>{error}</span>
          <button onClick={() => setError(null)} className={styles.alertClose}>×</button>
        </div>
      )}

      {success && (
        <div className={styles.alert} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ color: '#15803d' }}>{success}</span>
          <button onClick={() => setSuccess(null)} className={styles.alertClose}>×</button>
        </div>
      )}

      {/* Business Name */}
      <div className={styles.settingCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Business Name</h3>
            <p className={styles.cardDescription}>This name appears on your dashboard and member-facing pages</p>
          </div>
          {!editingBusinessName && (
            <button
              onClick={() => setEditingBusinessName(true)}
              className={styles.editButton}
            >
              Edit
            </button>
          )}
        </div>

        {editingBusinessName ? (
          <div className={styles.formGroup}>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={styles.input}
              placeholder="Enter business name"
            />
            <div className={styles.buttonGroup}>
              <button
                onClick={handleUpdateBusinessName}
                disabled={loading}
                className={styles.saveButton}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingBusinessName(false);
                  setBusinessName(merchantData.name);
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayValue}>{merchantData.name}</div>
        )}
      </div>

      {/* Email Address */}
      <div className={styles.settingCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Email Address</h3>
            <p className={styles.cardDescription}>Used for login and account notifications</p>
          </div>
          {!editingEmail && (
            <button
              onClick={() => setEditingEmail(true)}
              className={styles.editButton}
            >
              Edit
            </button>
          )}
        </div>

        {editingEmail ? (
          <div className={styles.formGroup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Enter email address"
            />
            <div className={styles.buttonGroup}>
              <button
                onClick={handleUpdateEmail}
                disabled={loading}
                className={styles.saveButton}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingEmail(false);
                  setEmail(merchantData.loginEmail);
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayValue}>{merchantData.loginEmail}</div>
        )}
      </div>

      {/* Password */}
      <div className={styles.settingCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Password</h3>
            <p className={styles.cardDescription}>Change your account password</p>
          </div>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className={styles.editButton}
            >
              Change Password
            </button>
          )}
        </div>

        {changingPassword ? (
          <div className={styles.formGroup}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={styles.input}
              placeholder="Current password"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={styles.input}
              placeholder="New password (min 8 characters)"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Confirm new password"
            />
            <div className={styles.buttonGroup}>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className={styles.saveButton}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              <button
                onClick={() => {
                  setChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayValue}>••••••••</div>
        )}
      </div>

      {/* Main Business Address */}
      <div className={styles.settingCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Main Business Address</h3>
            <p className={styles.cardDescription}>Primary location address</p>
          </div>
          {!editingAddress && (
            <button
              onClick={() => setEditingAddress(true)}
              className={styles.editButton}
            >
              Edit
            </button>
          )}
        </div>

        {editingAddress ? (
          <div className={styles.formGroup}>
            <textarea
              value={mainAddress}
              onChange={(e) => setMainAddress(e.target.value)}
              className={styles.textarea}
              placeholder="Enter business address"
              rows={3}
            />
            <div className={styles.buttonGroup}>
              <button
                onClick={handleUpdateMainAddress}
                disabled={loading}
                className={styles.saveButton}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingAddress(false);
                  setMainAddress(merchantData.mainBusiness?.address || '');
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayValue}>{merchantData.mainBusiness?.address || 'Not set'}</div>
        )}
      </div>

      {/* Multi-Location Management */}
      <div className={styles.settingCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Additional Locations</h3>
            <p className={styles.cardDescription}>Manage all your business locations</p>
          </div>
          {!addingLocation && !editingLocationId && (
            <button
              onClick={() => setAddingLocation(true)}
              className={styles.addButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Location
            </button>
          )}
        </div>

        {/* Add Location Form */}
        {addingLocation && (
          <div className={styles.locationForm}>
            <input
              type="text"
              value={locationForm.name}
              onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              className={styles.input}
              placeholder="Location name (e.g., Downtown Branch)"
            />
            <input
              type="text"
              value={locationForm.nickname}
              onChange={(e) => setLocationForm({ ...locationForm, nickname: e.target.value })}
              className={styles.input}
              placeholder="Nickname (optional)"
            />
            <textarea
              value={locationForm.address}
              onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
              className={styles.textarea}
              placeholder="Full address"
              rows={2}
            />
            <div className={styles.buttonGroup}>
              <button
                onClick={handleAddLocation}
                disabled={loading}
                className={styles.saveButton}
              >
                {loading ? 'Adding...' : 'Add Location'}
              </button>
              <button
                onClick={() => {
                  setAddingLocation(false);
                  setLocationForm({ name: '', nickname: '', address: '' });
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className={styles.locationsList}>
          {merchantData.additionalLocations && merchantData.additionalLocations.length > 0 ? (
            merchantData.additionalLocations.map((location: any) => (
              <div key={location.id} className={styles.locationItem}>
                {editingLocationId === location.id ? (
                  <div className={styles.locationForm}>
                    <input
                      type="text"
                      value={locationForm.name}
                      onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                      className={styles.input}
                      placeholder="Location name"
                    />
                    <input
                      type="text"
                      value={locationForm.nickname}
                      onChange={(e) => setLocationForm({ ...locationForm, nickname: e.target.value })}
                      className={styles.input}
                      placeholder="Nickname (optional)"
                    />
                    <textarea
                      value={locationForm.address}
                      onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                      className={styles.textarea}
                      placeholder="Full address"
                      rows={2}
                    />
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => handleUpdateLocation(location.id)}
                        disabled={loading}
                        className={styles.saveButton}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLocationId(null);
                          setLocationForm({ name: '', nickname: '', address: '' });
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.locationInfo}>
                      <h4 className={styles.locationName}>
                        {location.name}
                        {location.locationNickname && (
                          <span className={styles.locationNickname}>({location.locationNickname})</span>
                        )}
                      </h4>
                      <p className={styles.locationAddress}>{location.address}</p>
                    </div>
                    <div className={styles.locationActions}>
                      <button
                        onClick={() => startEditLocation(location)}
                        className={styles.iconButton}
                        title="Edit location"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className={styles.iconButton}
                        style={{ color: '#dc2626' }}
                        title="Delete location"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            !addingLocation && (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>No additional locations yet</p>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Click "Add Location" to add more business locations</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
