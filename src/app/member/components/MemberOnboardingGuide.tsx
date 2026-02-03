"use client";

import { useState, useEffect } from "react";

type OnboardingStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
};

const STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Your Rewards Dashboard",
    description:
      "This is your home for tracking points, redeeming rewards, and managing your loyalty memberships across all participating businesses.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#244b7a" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    tip: "Bookmark this page for easy access!",
  },
  {
    title: "Earn Points by Visiting",
    description:
      "Every time you visit a participating business, scan their QR code to earn points. The more you visit, the more you earn!",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    tip: "Look for QR codes at the register or on receipts",
  },
  {
    title: "Redeem Rewards",
    description:
      "Once you've earned enough points, redeem them for free items, discounts, or even USDC cryptocurrency payments at participating businesses.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    tip: "Click 'Redeem Now' on any reward to get started",
  },
  {
    title: "Special Rewards & Bonuses",
    description:
      "Add your birthday and anniversary in Settings to receive bonus points! Many businesses offer special rewards for these occasions.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
      </svg>
    ),
    tip: "Go to Settings to add your special dates",
  },
  {
    title: "Refer Friends, Earn More",
    description:
      "Many businesses offer referral bonuses. Share your unique referral link with friends and earn extra points when they sign up!",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    tip: "Look for the 'Refer a Friend' card in Available Rewards",
  },
  {
    title: "You're All Set!",
    description:
      "Start visiting your favorite businesses and earning rewards. Your points and activity will appear on this dashboard in real-time.",
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#244b7a" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tip: "Questions? Contact the business directly or check your Settings",
  },
];

const STORAGE_KEY = "gob_member_onboarding_complete";

type MemberOnboardingGuideProps = {
  onComplete?: () => void;
  forceShow?: boolean;
};

export default function MemberOnboardingGuide({
  onComplete,
  forceShow = false,
}: MemberOnboardingGuideProps) {
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
          maxWidth: "480px",
          overflow: "hidden",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Progress Bar */}
        <div
          style={{
            height: "4px",
            background: "#e5e7eb",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              background: "linear-gradient(to right, #244b7a, #8bbcff)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "2.5rem 2rem" }}>
          {/* Icon */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
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
              fontSize: "1.5rem",
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
              margin: "0 0 1.5rem 0",
              fontSize: "1rem",
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
                background: "#fef3c7",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>💡</span>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: "#92400e",
                  fontWeight: "500",
                }}
              >
                {step.tip}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1.25rem 2rem",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Step Indicator */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: idx === currentStep ? "#244b7a" : "#d1d5db",
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
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Skip
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
                  fontSize: "0.9rem",
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
                padding: "0.625rem 1.5rem",
                background: "linear-gradient(to right, #244b7a, #3b6eaa)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {isLastStep ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
