// Tier Display Names - Military Theme
// Maps internal tier values to display names with subtitles

export type TierDisplayInfo = {
  name: string;        // Military rank name (Rookie, Soldier, General)
  subtitle: string;    // Descriptor for non-military understanding
  fullDisplay: string; // "Rookie (Joined)"
  internalValue: string; // Database value (BASE, VIP, SUPER)
};

// Map internal tier values to display info
const tierDisplayMap: Record<string, TierDisplayInfo> = {
  BASE: {
    name: 'Rookie',
    subtitle: 'Joined',
    fullDisplay: 'Rookie',
    internalValue: 'BASE',
  },
  VIP: {
    name: 'Soldier',
    subtitle: 'Trusted',
    fullDisplay: 'Soldier',
    internalValue: 'VIP',
  },
  SUPER: {
    name: 'General',
    subtitle: 'Honor',
    fullDisplay: 'General',
    internalValue: 'SUPER',
  },
  // Future 4th tier if added
  CAPTAIN: {
    name: 'Captain',
    subtitle: 'Dedicated',
    fullDisplay: 'Captain',
    internalValue: 'CAPTAIN',
  },
};

// Get display info for a tier
export function getTierDisplay(internalTier: string): TierDisplayInfo {
  const upperTier = internalTier?.toUpperCase() || 'BASE';
  return tierDisplayMap[upperTier] || tierDisplayMap.BASE;
}

// Get just the display name (e.g., "Rookie")
export function getTierName(internalTier: string): string {
  return getTierDisplay(internalTier).name;
}

// Get the subtitle (e.g., "Joined")
export function getTierSubtitle(internalTier: string): string {
  return getTierDisplay(internalTier).subtitle;
}

// Get full display with subtitle (e.g., "Rookie Member")
export function getTierFullName(internalTier: string): string {
  const info = getTierDisplay(internalTier);
  return `${info.name} Member`;
}

// Get tier badge text (e.g., "ROOKIE" for badge display)
export function getTierBadgeText(internalTier: string): string {
  return getTierDisplay(internalTier).name.toUpperCase();
}

// All tiers in order for display
export const orderedTiers = ['BASE', 'VIP', 'SUPER'] as const;

// Get all tier display info in order
export function getAllTiersDisplay(): TierDisplayInfo[] {
  return orderedTiers.map(tier => tierDisplayMap[tier]);
}
