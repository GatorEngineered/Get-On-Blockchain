// src/app/lib/merchants.ts

export type MerchantConfig = {
  slug: string;
  name: string;
  tagline: string;
};

export const merchants: MerchantConfig[] = [
  {
    slug: "demo-coffee-shop",
    name: "Demo Coffee Shop",
    tagline: "Scan at checkout. Earn 5% back in USDC every visit.",
  },
  {
    slug: "zen-gym",
    name: "Zen Gym",
    tagline: "Earn crypto rewards for every class and membership renewal.",
  },
];

export function getMerchantBySlug(slug: string): MerchantConfig | null {
  const match = merchants.find((m) => m.slug === slug);
  return match ?? null;
}
