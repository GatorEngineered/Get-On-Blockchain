// Zod validation schemas for API routes
import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Member schemas
export const createEmailMemberSchema = z.object({
  merchantSlug: z.string().optional(),
  merchant: z.string().optional(),
  email: z.string().email("Invalid email address"),
});

export const memberLookupSchema = z.object({
  merchant: z.string().min(1, "Merchant is required"),
  memberId: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
}).refine(
  (data) => data.memberId || data.email,
  {
    message: "Either memberId or email must be provided",
  }
);

// Wallet schemas
export const connectWalletSchema = z.object({
  merchantSlug: z.string().min(1, "Merchant slug is required"),
  memberId: z.string().min(1, "Member ID is required"),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

// Reward schemas
export const rewardEarnSchema = z.object({
  businessMemberId: z.string().min(1, "Business member ID is required"),
  amount: z.number().int().positive().optional(),
});

export const rewardEarnEventSchema = z.object({
  merchantSlug: z.string().min(1, "Merchant slug is required"),
  memberId: z.string().min(1, "Member ID is required"),
  reason: z.string().optional(),
  source: z.string().optional(),
});

export const rewardRedeemSchema = z.object({
  merchant: z.string().min(1, "Merchant is required"),
  memberId: z.string().min(1, "Member ID is required"),
  points: z.number().int().positive().default(10),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Staff schemas
export const memberRegisterForBusinessSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  businessId: z.string().min(1, "Business ID is required"),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  walletNetwork: z.string().optional(),
  isCustodial: z.boolean().optional(),
});

export const setWalletModeSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  businessId: z.string().min(1, "Business ID is required"),
  isCustodial: z.boolean(),
});

// Merchant settings schema
export const merchantSettingsSchema = z.object({
  welcomePoints: z.number().int().min(0).optional(),
  earnPerVisit: z.number().int().min(0).optional(),
  vipThreshold: z.number().int().min(0).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Support schema
export const supportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Track scan schema
export const trackScanSchema = z.object({
  merchantSlug: z.string().min(1, "Merchant slug is required"),
  memberId: z.string().optional(),
  source: z.string().optional(),
});