// src/app/join/[slug]/page.tsx
// Public referral landing page

import { prisma } from '@/app/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

interface JoinPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; src?: string }>;
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { slug } = await params;
  const { ref, src } = await searchParams;

  // Get merchant info
  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      welcomePoints: true,
      referralEnabled: true,
      referralPointsValue: true,
      primaryColor: true,
    },
  });

  if (!merchant) {
    notFound();
  }

  // Look up referrer if referral code provided
  let referrer: { firstName: string; lastName: string } | null = null;
  if (ref) {
    const merchantMember = await prisma.merchantMember.findUnique({
      where: { referralCode: ref },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (merchantMember && merchantMember.merchantId === merchant.id) {
      referrer = merchantMember.member;
    }
  }

  // Build register URL with merchant and referral info
  const registerUrl = `/member/register?merchant=${merchant.slug}${ref ? `&ref=${ref}` : ''}${src ? `&src=${src}` : ''}`;

  const primaryColor = merchant.primaryColor || '#6366f1';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${primaryColor}15 0%, #f8fafc 50%, ${primaryColor}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'white',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            padding: '2rem',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'white',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
            }}
          >
            🎁
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem' }}>
            You&apos;re Invited!
          </h1>
          {referrer && (
            <p style={{ opacity: 0.9, margin: 0 }}>
              {referrer.firstName || 'A friend'} invited you to join
            </p>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {/* Merchant Name */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem' }}>
              {merchant.name}
            </h2>
            {merchant.tagline && (
              <p style={{ color: '#6b7280', margin: 0 }}>{merchant.tagline}</p>
            )}
          </div>

          {/* Welcome Points Offer */}
          <div
            style={{
              background: `${primaryColor}10`,
              border: `2px dashed ${primaryColor}`,
              borderRadius: '1rem',
              padding: '1.25rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '3rem', fontWeight: '800', color: primaryColor }}>
              +{merchant.welcomePoints}
            </div>
            <div style={{ color: '#4b5563', fontWeight: '500' }}>
              Welcome Points
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Join and get instant bonus points!
            </div>
          </div>

          {/* Benefits */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>✨</span>
              <span style={{ color: '#374151' }}>Earn points on every visit</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🎉</span>
              <span style={{ color: '#374151' }}>Unlock exclusive rewards</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>💰</span>
              <span style={{ color: '#374151' }}>Special member-only perks</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={registerUrl}
            style={{
              display: 'block',
              width: '100%',
              padding: '1rem',
              background: primaryColor,
              color: 'white',
              textAlign: 'center',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '1.125rem',
              textDecoration: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            Join Now - It&apos;s Free!
          </Link>

          {/* Already a member */}
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link
              href={`/member/login?returnTo=/member/dashboard`}
              style={{ color: primaryColor, textDecoration: 'none', fontWeight: '500' }}
            >
              Log in
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 2rem',
            background: '#f9fafb',
            borderTop: '1px solid #f3f4f6',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>
            Powered by{' '}
            <Link
              href="https://getonblock.com"
              style={{ color: '#6b7280', textDecoration: 'none' }}
            >
              Get On Block
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: { name: true, tagline: true, welcomePoints: true },
  });

  if (!merchant) {
    return { title: 'Join Rewards Program' };
  }

  return {
    title: `Join ${merchant.name}'s Rewards Program`,
    description: merchant.tagline || `Join ${merchant.name} and earn ${merchant.welcomePoints} welcome points!`,
    openGraph: {
      title: `You're Invited to ${merchant.name}!`,
      description: `Join and get ${merchant.welcomePoints} welcome points!`,
    },
  };
}
