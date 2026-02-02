// Tier Display Names - Military Theme
// Maps internal tier values to display names with subtitles
//
// Plan tier limits:
// - STARTER: 3 tiers (Rookie, Soldier, General)
// - BASIC: 4 tiers (Rookie, Soldier, Captain, General)
// - PREMIUM: 6 tiers (Rookie, Soldier, Sergeant, Captain, Major, General)
// - GROWTH/PRO: Custom tiers

export type TierDisplayInfo = {
  name: string;        // Military rank name (Rookie, Soldier, General)
  subtitle: string;    // Descriptor for non-military understanding
  fullDisplay: string; // "Rookie (Joined)"
  internalValue: string; // Database value (BASE, VIP, SUPER, etc.)
  sortOrder: number;   // Order for display (lower = earlier tier)
};

// Map internal tier values to display info
const tierDisplayMap: Record<string, TierDisplayInfo> = {
  BASE: {
    name: 'Rookie',
    subtitle: 'Joined',
    fullDisplay: 'Rookie',
    internalValue: 'BASE',
    sortOrder: 0,
  },
  VIP: {
    name: 'Soldier',
    subtitle: 'Trusted',
    fullDisplay: 'Soldier',
    internalValue: 'VIP',
    sortOrder: 1,
  },
  SERGEANT: {
    name: 'Sergeant',
    subtitle: 'Proven',
    fullDisplay: 'Sergeant',
    internalValue: 'SERGEANT',
    sortOrder: 2,
  },
  CAPTAIN: {
    name: 'Captain',
    subtitle: 'Dedicated',
    fullDisplay: 'Captain',
    internalValue: 'CAPTAIN',
    sortOrder: 3,
  },
  MAJOR: {
    name: 'Major',
    subtitle: 'Leader',
    fullDisplay: 'Major',
    internalValue: 'MAJOR',
    sortOrder: 4,
  },
  SUPER: {
    name: 'General',
    subtitle: 'Honor',
    fullDisplay: 'General',
    internalValue: 'SUPER',
    sortOrder: 5,
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

// All tiers in order for display (full list)
export const allOrderedTiers = ['BASE', 'VIP', 'SERGEANT', 'CAPTAIN', 'MAJOR', 'SUPER'] as const;

// Legacy: 3-tier system for backward compatibility
export const orderedTiers = ['BASE', 'VIP', 'SUPER'] as const;

// Tiers available by plan
export const tiersByPlan: Record<string, readonly string[]> = {
  STARTER: ['BASE', 'VIP', 'SUPER'],                                    // 3 tiers
  BASIC: ['BASE', 'VIP', 'CAPTAIN', 'SUPER'],                           // 4 tiers
  PREMIUM: ['BASE', 'VIP', 'SERGEANT', 'CAPTAIN', 'MAJOR', 'SUPER'],    // 6 tiers
  GROWTH: allOrderedTiers,                                               // All + custom
  PRO: allOrderedTiers,                                                  // All + custom
};

// Get tiers available for a specific plan
export function getTiersForPlan(plan: string): TierDisplayInfo[] {
  const tiers = tiersByPlan[plan] || tiersByPlan.STARTER;
  return tiers.map(tier => tierDisplayMap[tier]).filter(Boolean);
}

// Get number of tiers allowed for a plan
export function getTierCountForPlan(plan: string): number {
  return (tiersByPlan[plan] || tiersByPlan.STARTER).length;
}

// Get all tier display info in order (legacy - returns 3 tiers)
export function getAllTiersDisplay(): TierDisplayInfo[] {
  return orderedTiers.map(tier => tierDisplayMap[tier]);
}

// Get all available tiers (full 6-tier list)
export function getAllAvailableTiers(): TierDisplayInfo[] {
  return allOrderedTiers.map(tier => tierDisplayMap[tier]);
}
