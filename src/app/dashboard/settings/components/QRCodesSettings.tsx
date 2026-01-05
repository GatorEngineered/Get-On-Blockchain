'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import styles from './QRCodesSettings.module.css';

interface QRCodesSettingsProps {
  merchantData: any;
}

export default function QRCodesSettings({ merchantData }: QRCodesSettingsProps) {
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQRCodes();
  }, [merchantData]);

  async function generateQRCodes() {
    if (!merchantData?.businesses) {
      setLoading(false);
      return;
    }

    try {
      const codes: { [key: string]: string } = {};

      for (const business of merchantData.businesses) {
        // Generate QR code URL for each business location
        const scanUrl = `${window.location.origin}/scan/${business.slug}`;

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          margin: 2,
          width: 400,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        codes[business.id] = qrCodeDataUrl;
      }

      setQrCodes(codes);
    } catch (err) {
      console.error('Error generating QR codes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function downloadQRCode(business: any) {
    const qrCodeDataUrl = qrCodes[business.id];
    if (!qrCodeDataUrl) return;

    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${business.slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Generating QR codes...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className={styles.title}>QR Codes</h2>
      <p className={styles.subtitle}>
        Display these codes at your point of sale for customers to scan and earn points
      </p>

      {/* Instructions */}
      <div className={styles.instructionCard}>
        <h3 className={styles.instructionTitle}>How to use:</h3>
        <ol className={styles.instructionList}>
          <li>Download the QR code for your location</li>
          <li>Display it on your POS screen or print it on receipts</li>
          <li>Customers scan the code with their phone camera</li>
          <li>They'll be prompted to login or sign up</li>
          <li>Points are awarded automatically after scanning</li>
        </ol>
        <div className={styles.instructionNote}>
          <strong>Tip:</strong> Print the QR code at a size of at least 2x2 inches for easy scanning.
        </div>
      </div>

      {/* QR Codes for Each Location */}
      {merchantData?.businesses?.map((business: any) => (
        <div key={business.id} className={styles.qrCard}>
          <div className={styles.qrHeader}>
            <div>
              <h3 className={styles.qrTitle}>
                {business.locationNickname || business.name}
              </h3>
              <p className={styles.qrAddress}>{business.address}</p>
              <p className={styles.qrUrl}>
                Scan URL: {window.location.origin}/scan/{business.slug}
              </p>
            </div>
            <button
              onClick={() => downloadQRCode(business)}
              className={styles.downloadButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download QR Code
            </button>
          </div>

          <div className={styles.qrCodeContainer}>
            {qrCodes[business.id] ? (
              <img
                src={qrCodes[business.id]}
                alt={`QR Code for ${business.name}`}
                className={styles.qrCodeImage}
              />
            ) : (
              <div className={styles.qrCodePlaceholder}>
                <p>QR code not available</p>
              </div>
            )}
          </div>

          <div className={styles.qrStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Scans Today:</span>
              <span className={styles.statValue}>0</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Scans:</span>
              <span className={styles.statValue}>0</span>
            </div>
          </div>
        </div>
      ))}

      {/* No Locations */}
      {(!merchantData?.businesses || merchantData.businesses.length === 0) && (
        <div className={styles.emptyState}>
          <p>No business locations found. Add a location in Account Settings to generate a QR code.</p>
        </div>
      )}

      {/* Additional Info */}
      <div className={styles.infoCard}>
        <h4 className={styles.infoTitle}>Need Multiple QR Codes?</h4>
        <p className={styles.infoText}>
          Each business location has its own unique QR code. Add additional locations in the{' '}
          <strong>Account Settings</strong> to generate more QR codes. This is useful if you have
          multiple stores, pop-up locations, or different service areas.
        </p>
      </div>
    </div>
  );
}
