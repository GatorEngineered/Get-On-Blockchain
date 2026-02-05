-- Enable Row Level Security on all tables
-- Since we use Prisma (not Supabase client), we enable RLS without policies
-- This blocks PostgREST API access while Prisma continues to work via direct connection

-- Core tables
ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Merchant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Business" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Staff" ENABLE ROW LEVEL SECURITY;

-- Member/Merchant relationship tables
ALTER TABLE "MerchantMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusinessMember" ENABLE ROW LEVEL SECURITY;

-- Authentication tokens (sensitive)
ALTER TABLE "MemberLoginToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;

-- Loyalty program tables
ALTER TABLE "Reward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RewardTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Scan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QRCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;

-- Configuration tables
ALTER TABLE "PayoutMilestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PointsConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberTierConfig" ENABLE ROW LEVEL SECURITY;

-- Wallet/Payout tables
ALTER TABLE "MemberWallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayoutNotificationRequest" ENABLE ROW LEVEL SECURITY;

-- Admin tables
ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminAuditLog" ENABLE ROW LEVEL SECURITY;

-- Content tables
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;

-- Token/Blockchain tables
ALTER TABLE "MerchantToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TokenTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TokenBalance" ENABLE ROW LEVEL SECURITY;

-- Event tracking tables
ALTER TABLE "EventScan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventQRCode" ENABLE ROW LEVEL SECURITY;

-- Redemption tables
ALTER TABLE "RedemptionRequest" ENABLE ROW LEVEL SECURITY;

-- API tables
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiUsageLog" ENABLE ROW LEVEL SECURITY;

-- External integrations
ALTER TABLE "ExternalOrder" ENABLE ROW LEVEL SECURITY;

-- Points rules
ALTER TABLE "PointsRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PointsRuleUsage" ENABLE ROW LEVEL SECURITY;

-- Social engagement
ALTER TABLE "SocialEngagement" ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled (optional check)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
