// src/app/lib/referral-code.ts
// Utility functions for generating and managing referral codes/links

/**
 * Generate a unique 8-character alphanumeric referral code
 * Format: 3 uppercase letters + 5 digits (e.g., "ABC12345")
 */
export function generateReferralCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O to avoid confusion with 1 and 0
  const digits = '0123456789';

  let code = '';

  // 3 random letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // 5 random digits
  for (let i = 0; i < 5; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }

  return code;
}

/**
 * Build a shareable referral URL
 * @param merchantSlug - The merchant's URL slug
 * @param referralCode - The member's unique referral code
 * @param source - Optional: track where the share came from (twitter, facebook, etc.)
 */
export function buildReferralUrl(
  merchantSlug: string,
  referralCode: string,
  source?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getonblock.com';
  let url = `${baseUrl}/join/${merchantSlug}?ref=${referralCode}`;

  if (source) {
    url += `&src=${source}`;
  }

  return url;
}

/**
 * Social share templates for different platforms
 */
export interface ShareTemplates {
  twitter: string;
  facebook: string;
  whatsapp: string;
  email: {
    subject: string;
    body: string;
  };
}

/**
 * Generate share templates for different social platforms
 * @param merchantName - The merchant's display name
 * @param referralUrl - The full referral URL
 * @param pointsValue - Points the friend will earn
 */
export function generateShareTemplates(
  merchantName: string,
  referralUrl: string,
  pointsValue: number
): ShareTemplates {
  const message = `Join ${merchantName}'s rewards program and earn ${pointsValue} points on your first visit!`;

  return {
    twitter: `${message} ${referralUrl}`,
    facebook: referralUrl, // Facebook uses the URL directly in their share dialog
    whatsapp: `${message}\n\n${referralUrl}`,
    email: {
      subject: `Join ${merchantName}'s Rewards Program`,
      body: `Hey!\n\nI've been earning rewards at ${merchantName} and thought you'd like it too.\n\nSign up using my link and you'll get ${pointsValue} welcome points:\n${referralUrl}\n\nSee you there!`,
    },
  };
}

/**
 * Build social share URLs for one-click sharing
 */
export function buildShareUrls(
  merchantSlug: string,
  referralCode: string,
  merchantName: string,
  pointsValue: number
): {
  twitter: string;
  facebook: string;
  whatsapp: string;
  email: string;
  copyUrl: string;
} {
  const baseReferralUrl = buildReferralUrl(merchantSlug, referralCode);
  const templates = generateShareTemplates(merchantName, baseReferralUrl, pointsValue);

  // Add tracking source to each URL
  const twitterUrl = buildReferralUrl(merchantSlug, referralCode, 'twitter');
  const facebookUrl = buildReferralUrl(merchantSlug, referralCode, 'facebook');
  const whatsappUrl = buildReferralUrl(merchantSlug, referralCode, 'whatsapp');
  const emailUrl = buildReferralUrl(merchantSlug, referralCode, 'email');
  const copyUrl = buildReferralUrl(merchantSlug, referralCode, 'link');

  const message = `Join ${merchantName}'s rewards program and earn ${pointsValue} points!`;

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(twitterUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${whatsappUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(templates.email.subject)}&body=${encodeURIComponent(templates.email.body.replace(baseReferralUrl, emailUrl))}`,
    copyUrl: copyUrl,
  };
}
