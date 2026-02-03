"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
  action?: {
    label: string;
    href: string;
  };
};

const STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Your Business Dashboard",
    description:
      "This is your command center for managing your loyalty program. Track members, view analytics, and grow customer engagement.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#244b7a" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    tip: "Your 7-day free trial has started!",
  },
  {
    title: "Display Your QR Code",
    description:
      "Download and display your unique QR code at your point of sale. Customers scan it to check in and earn points automatically.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    tip: "Print it, display on a tablet, or show on your POS screen",
    action: {
      label: "Go to QR Codes",
      href: "/dashboard/settings?tab=qr-codes",
    },
  },
  {
    title: "Set Up Your Rewards",
    description:
      "Create compelling rewards that keep customers coming back. Set how many points each visit earns and what rewards they can redeem.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    tip: "Popular rewards: Free coffee, 20% off, Buy 10 Get 1 Free",
    action: {
      label: "Configure Rewards",
      href: "/dashboard/settings?tab=rewards",
    },
  },
  {
    title: "Connect Your POS (Optional)",
    description:
      "Connect Square, Shopify, or other POS systems to automatically award points when customers make purchases. No QR scan needed!",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    tip: "Go to Settings > Integrations to connect your POS",
    action: {
      label: "Connect POS",
      href: "/dashboard/settings?tab=pos-integration",
    },
  },
  {
    title: "Manage Your Members",
    description:
      "View all your members, their visit history, and points balances. You can reward bonus points, send announcements, or adjust points manually.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    tip: "Use the Members page to see who's most loyal",
    action: {
      label: "View Members",
      href: "/dashboard/members",
    },
  },
  {
    title: "Enable USDC Payouts (Optional)",
    description:
      "Reward your best customers with real cryptocurrency! Set up a payout wallet to send USDC to members who reach point milestones.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: "USDC is a stablecoin worth $1 - great for high-value rewards",
    action: {
      label: "Set Up Payouts",
      href: "/dashboard/settings?tab=payout-wallet",
    },
  },
  {
    title: "You're Ready to Go!",
    description:
      "Your loyalty program is set up. Start promoting it to your customers and watch your engagement grow. Remember to check your dashboard regularly!",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#244b7a" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: "Need help? Contact support@getonblockchain.com",
  },
];

const STORAGE_KEY = "gob_merchant_onboarding_complete";

type MerchantOnboardingGuideProps = {
  onComplete?: () => void;
  forceShow?: boolean;
};

export default function MerchantOnboardingGuide({
  onComplete,
  forceShow = false,
}: MerchantOnboardingGuideProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already completed onboarding
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      setIsVisible(true);
    }
  }, [forceShow]);

  function handleNext() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  }

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  }

  function handleAction(href: string) {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
    router.push(href);
    onComplete?.();
  }

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "520px",
          overflow: "hidden",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Header with Progress */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "linear-gradient(to right, #244b7a, #3b6eaa)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "white",
            }}
          >
            Getting Started
          </span>
          <span
            style={{
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: "3px",
            background: "#e5e7eb",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              background: "#10b981",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "2rem" }}>
          {/* Icon */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            {step.icon}
          </div>

          {/* Title */}
          <h2
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1.375rem",
              fontWeight: "700",
              color: "#1f2937",
              textAlign: "center",
            }}
          >
            {step.title}
          </h2>

          {/* Description */}
          <p
            style={{
              margin: "0 0 1.25rem 0",
              fontSize: "0.95rem",
              color: "#4b5563",
              textAlign: "center",
              lineHeight: "1.6",
            }}
          >
            {step.description}
          </p>

          {/* Tip */}
          {step.tip && (
            <div
              style={{
                padding: "0.875rem 1rem",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: step.action ? "1rem" : 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "#1e40af",
                  fontWeight: "500",
                }}
              >
                {step.tip}
              </p>
            </div>
          )}

          {/* Action Button */}
          {step.action && (
            <button
              onClick={() => handleAction(step.action!.href)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.75rem 1rem",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {step.action.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 2rem 1.5rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Step Indicator */}
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? "20px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: idx === currentStep ? "#244b7a" : idx < currentStep ? "#10b981" : "#d1d5db",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {currentStep === 0 ? (
              <button
                onClick={handleSkip}
                style={{
                  padding: "0.625rem 1rem",
                  background: "transparent",
                  color: "#6b7280",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Skip Tour
              </button>
            ) : (
              <button
                onClick={handlePrev}
                style={{
                  padding: "0.625rem 1rem",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                padding: "0.625rem 1.25rem",
                background: "linear-gradient(to right, #244b7a, #3b6eaa)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {isLastStep ? "Start Using Dashboard" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
