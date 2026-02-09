'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AccountSettings.module.css';

interface AccountSettingsProps {
  merchantData: any;
  onUpdate: (data: any) => void;
  onRefresh: () => void;
}

export default function AccountSettings({ merchantData, onUpdate, onRefresh }: AccountSettingsProps) {
  const router = useRouter();
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
  const [mainAddressForm, setMainAddressForm] = useState({
    address: merchantData?.mainBusiness?.address || '',
    suite: merchantData?.mainBusiness?.suite || '',
    city: merchantData?.mainBusiness?.city || '',
    state: merchantData?.mainBusiness?.state || '',
    zipCode: merchantData?.mainBusiness?.zipCode || '',
  });

  // Multi-location State
  const [addingLocation, setAddingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    nickname: '',
    address: '',
    suite: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!mainAddressForm.address.trim()) {
      setError('Street address is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/merchant/update-main-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mainAddressForm),
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

  // Helper to format address for display
  function formatAddress(business: any): string {
    if (!business) return 'Not set';
    const parts = [business.address];
    if (business.suite) parts[0] += `, ${business.suite}`;
    if (business.city || business.state || business.zipCode) {
      const cityStateZip = [
        business.city,
        business.state,
        business.zipCode,
      ].filter(Boolean).join(', ');
      if (cityStateZip) parts.push(cityStateZip);
    }
    return parts.join('\n') || 'Not set';
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
      setLocationForm({ name: '', nickname: '', address: '', suite: '', city: '', state: '', zipCode: '' });
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
      setLocationForm({ name: '', nickname: '', address: '', suite: '', city: '', state: '', zipCode: '' });
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
      address: location.address || '',
      suite: location.suite || '',
      city: location.city || '',
      state: location.state || '',
      zipCode: location.zipCode || '',
    });
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    if (!deletePassword) {
      setError('Please enter your password');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/merchant/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
          confirmText: deleteConfirmText,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Account deleted - redirect to homepage
      router.push('/?deleted=true');
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
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
            <div className={styles.addressGrid}>
              <div>
                <label className={styles.inputLabel}>Street Address *</label>
                <input
                  type="text"
                  value={mainAddressForm.address}
                  onChange={(e) => setMainAddressForm({ ...mainAddressForm, address: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className={styles.inputLabel}>Suite/Unit</label>
                <input
                  type="text"
                  value={mainAddressForm.suite}
                  onChange={(e) => setMainAddressForm({ ...mainAddressForm, suite: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="Suite 100"
                />
              </div>
            </div>
            <div className={styles.cityStateZip}>
              <div>
                <label className={styles.inputLabel}>City</label>
                <input
                  type="text"
                  value={mainAddressForm.city}
                  onChange={(e) => setMainAddressForm({ ...mainAddressForm, city: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="City"
                />
              </div>
              <div>
                <label className={styles.inputLabel}>State</label>
                <input
                  type="text"
                  value={mainAddressForm.state}
                  onChange={(e) => setMainAddressForm({ ...mainAddressForm, state: e.target.value.toUpperCase().slice(0, 2) })}
                  className={styles.inputSmall}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
              <div>
                <label className={styles.inputLabel}>ZIP Code</label>
                <input
                  type="text"
                  value={mainAddressForm.zipCode}
                  onChange={(e) => setMainAddressForm({ ...mainAddressForm, zipCode: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="90210"
                />
              </div>
            </div>
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
                  setMainAddressForm({
                    address: merchantData.mainBusiness?.address || '',
                    suite: merchantData.mainBusiness?.suite || '',
                    city: merchantData.mainBusiness?.city || '',
                    state: merchantData.mainBusiness?.state || '',
                    zipCode: merchantData.mainBusiness?.zipCode || '',
                  });
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayValue} style={{ whiteSpace: 'pre-line' }}>
            {formatAddress(merchantData.mainBusiness)}
          </div>
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
            <div className={styles.addressGrid}>
              <div>
                <label className={styles.inputLabel}>Street Address *</label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label className={styles.inputLabel}>Suite/Unit</label>
                <input
                  type="text"
                  value={locationForm.suite}
                  onChange={(e) => setLocationForm({ ...locationForm, suite: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="Suite 100"
                />
              </div>
            </div>
            <div className={styles.cityStateZip}>
              <div>
                <label className={styles.inputLabel}>City</label>
                <input
                  type="text"
                  value={locationForm.city}
                  onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="City"
                />
              </div>
              <div>
                <label className={styles.inputLabel}>State</label>
                <input
                  type="text"
                  value={locationForm.state}
                  onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value.toUpperCase().slice(0, 2) })}
                  className={styles.inputSmall}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
              <div>
                <label className={styles.inputLabel}>ZIP Code</label>
                <input
                  type="text"
                  value={locationForm.zipCode}
                  onChange={(e) => setLocationForm({ ...locationForm, zipCode: e.target.value })}
                  className={styles.inputSmall}
                  placeholder="90210"
                />
              </div>
            </div>
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
                  setLocationForm({ name: '', nickname: '', address: '', suite: '', city: '', state: '', zipCode: '' });
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
                    <div className={styles.addressGrid}>
                      <div>
                        <label className={styles.inputLabel}>Street Address *</label>
                        <input
                          type="text"
                          value={locationForm.address}
                          onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                          className={styles.inputSmall}
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div>
                        <label className={styles.inputLabel}>Suite/Unit</label>
                        <input
                          type="text"
                          value={locationForm.suite}
                          onChange={(e) => setLocationForm({ ...locationForm, suite: e.target.value })}
                          className={styles.inputSmall}
                          placeholder="Suite 100"
                        />
                      </div>
                    </div>
                    <div className={styles.cityStateZip}>
                      <div>
                        <label className={styles.inputLabel}>City</label>
                        <input
                          type="text"
                          value={locationForm.city}
                          onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                          className={styles.inputSmall}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className={styles.inputLabel}>State</label>
                        <input
                          type="text"
                          value={locationForm.state}
                          onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value.toUpperCase().slice(0, 2) })}
                          className={styles.inputSmall}
                          placeholder="CA"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <label className={styles.inputLabel}>ZIP Code</label>
                        <input
                          type="text"
                          value={locationForm.zipCode}
                          onChange={(e) => setLocationForm({ ...locationForm, zipCode: e.target.value })}
                          className={styles.inputSmall}
                          placeholder="90210"
                        />
                      </div>
                    </div>
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
                          setLocationForm({ name: '', nickname: '', address: '', suite: '', city: '', state: '', zipCode: '' });
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
                      <p className={styles.locationAddress} style={{ whiteSpace: 'pre-line' }}>{formatAddress(location)}</p>
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

      {/* Delete Account Section */}
      <div className={styles.settingCard} style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle} style={{ color: '#991b1b' }}>Delete Account</h3>
            <p className={styles.cardDescription} style={{ color: '#b91c1c' }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={styles.deleteButton}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className={styles.modal} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#991b1b' }}>Delete Account</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                This will permanently delete your business account, all locations, member data, rewards, and transaction history.
              </p>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#991b1b',
                fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                Enter your password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={styles.input}
                placeholder="Your current password"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={styles.input}
                placeholder="DELETE"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                  setError(null);
                }}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'DELETE' || !deletePassword}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: deleteConfirmText === 'DELETE' && deletePassword ? '#dc2626' : '#9ca3af',
                  color: 'white',
                  cursor: deleteConfirmText === 'DELETE' && deletePassword ? 'pointer' : 'not-allowed',
                  fontWeight: 500,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
