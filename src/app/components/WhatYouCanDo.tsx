"use client";

export default function WhatYouCanDo() {
  return (
    <section className="section features-section" id="what-you-can-do">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">What You Can Do</p>
          <h2>Everything Traditional Loyalty Programs <span className="hero-accent">Can&apos;t</span></h2>
          <p className="section-sub">
            This is how loyalty should work. Real ownership. Real community. Real rewards.
          </p>
        </div>

        {/* Points You Own */}
        <div className="feature-block feature-block-alt">
          <div className="feature-content">
            <div className="feature-icon feature-icon-purple">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Points You <span className="title-accent">Actually Own</span></h3>
            <p className="feature-description">
              No more expiring points. No more "use it or lose it." Your members earn points
              that grow forever—gamified, accumulating, and truly theirs. They don't restart
              at zero after a purchase. They build wealth in your brand.
            </p>
            <ul className="feature-list">
              <li>Points never expire—ever</li>
              <li>Always accumulating, never resetting</li>
              <li>Gamified tiers that reward consistency</li>
              <li>Blockchain-verified ownership</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card feature-card-purple">
              <div className="feature-card-header">
                <span className="feature-card-badge">Member Balance</span>
              </div>
              <div className="feature-card-content">
                <div className="points-display">
                  <span className="points-number">2,847</span>
                  <span className="points-label">lifetime points</span>
                </div>
                <div className="points-growth">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>+124 this month</span>
                </div>
                <div className="points-footer">
                  <span className="points-never-expire">Never expires</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Special Days - Birthday & Anniversary */}
        <div className="feature-block">
          <div className="feature-visual">
            <div className="feature-card feature-card-rose">
              <div className="feature-card-header">
                <span className="feature-card-badge">Special Day Reward</span>
              </div>
              <div className="feature-card-content">
                <div className="special-day-display">
                  <div className="special-day-item">
                    <span className="special-day-icon">🎂</span>
                    <div className="special-day-info">
                      <span className="special-day-title">Happy Birthday!</span>
                      <span className="special-day-reward">+200 bonus points</span>
                    </div>
                  </div>
                  <div className="special-day-item">
                    <span className="special-day-icon">💕</span>
                    <div className="special-day-info">
                      <span className="special-day-title">Happy Anniversary!</span>
                      <span className="special-day-reward">+150 bonus points</span>
                    </div>
                  </div>
                </div>
                <div className="special-day-footer">
                  <span>Automatic rewards on their special days</span>
                </div>
              </div>
            </div>
          </div>
          <div className="feature-content">
            <div className="feature-icon feature-icon-rose">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h3>Celebrate <span className="title-accent">Their Special Days</span></h3>
            <p className="feature-description">
              Birthdays. Anniversaries. The moments that matter most to your members.
              Automatically reward them on their special days and make them feel truly
              valued. Personal touches that build lifelong loyalty.
            </p>
            <ul className="feature-list">
              <li>Birthday bonus points—automatic</li>
              <li>Relationship anniversary rewards</li>
              <li>Customizable reward amounts</li>
              <li>Personal messages on their day</li>
            </ul>
          </div>
        </div>

        {/* Exclusive Perks */}
        <div className="feature-block">
          <div className="feature-visual">
            <div className="feature-card feature-card-gold">
              <div className="feature-card-header">
                <span className="feature-card-badge">Exclusive Event</span>
              </div>
              <div className="feature-card-content">
                <div className="event-display">
                  <span className="event-title">VIP Tasting Night</span>
                  <span className="event-label">Scan QR for 3x points + exclusive badge</span>
                </div>
                <div className="event-perks">
                  <div className="perk-item">
                    <span className="perk-icon">🎫</span>
                    <span>Early access</span>
                  </div>
                  <div className="perk-item">
                    <span className="perk-icon">⭐</span>
                    <span>VIP-only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="feature-content">
            <div className="feature-icon feature-icon-gold">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3>Exclusive <span className="title-accent">Perks & Events</span></h3>
            <p className="feature-description">
              Create special moments. Host VIP events where members scan a QR to earn
              exclusive points and perks—labeled and tracked. Give your best customers
              experiences they can't get anywhere else.
            </p>
            <ul className="feature-list">
              <li>Event-specific QR codes for bonus points</li>
              <li>VIP-only perks clearly labeled</li>
              <li>Exclusive badges and achievements</li>
              <li>Early access for top-tier members</li>
            </ul>
          </div>
        </div>

        {/* Good Deeds Rewarded */}
        <div className="feature-block feature-block-alt">
          <div className="feature-content">
            <div className="feature-icon feature-icon-green">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3>Good Deeds <span className="title-accent">Rewarded</span></h3>
            <p className="feature-description">
              See a customer help another? Notice someone going above and beyond?
              Reward them instantly. Direct points for the moments that matter.
              Build a community that celebrates kindness.
            </p>
            <ul className="feature-list">
              <li>Instant points for noticed moments</li>
              <li>Personal thank-you messages attached</li>
              <li>Staff can reward directly</li>
              <li>Creates culture, not just transactions</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card feature-card-green">
              <div className="feature-card-header">
                <span className="feature-card-badge">Direct Reward</span>
              </div>
              <div className="feature-card-content">
                <div className="reward-display">
                  <span className="reward-amount">+50 pts</span>
                  <span className="reward-reason">"Thanks for helping that new customer find their way!"</span>
                </div>
                <div className="reward-from">
                  <span>— From the team at Orlando Cafe</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Token */}
        <div className="feature-block">
          <div className="feature-visual">
            <div className="feature-card feature-card-blue">
              <div className="feature-card-header">
                <span className="feature-card-badge">Your Brand Token</span>
              </div>
              <div className="feature-card-content">
                <div className="token-display">
                  <div className="token-icon">ORCA</div>
                  <div className="token-info">
                    <span className="token-name">Orlando Cafe Token</span>
                    <span className="token-balance">Balance: 847 ORCA</span>
                  </div>
                </div>
                <div className="token-actions">
                  <span className="token-action">Earn</span>
                  <span className="token-action">Trade</span>
                  <span className="token-action">Redeem</span>
                </div>
              </div>
            </div>
          </div>
          <div className="feature-content">
            <div className="feature-icon feature-icon-blue">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3>Your Brand, <span className="title-accent">Your Token</span></h3>
            <p className="feature-description">
              Create a branded cryptocurrency token for your business. Members earn it,
              trade it, redeem it, or convert it. Real digital ownership on the blockchain.
              Not loyalty points—brand equity.
            </p>
            <ul className="feature-list">
              <li>Custom branded ERC-20 token</li>
              <li>Members earn on every interaction</li>
              <li>Tradeable and transferable</li>
              <li>Redeemable for rewards or cash</li>
            </ul>
          </div>
        </div>

        {/* VIP Merch */}
        <div className="feature-block feature-block-alt">
          <div className="feature-content">
            <div className="feature-icon feature-icon-pink">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3>Earn <span className="title-accent">VIP Merchandise</span></h3>
            <p className="feature-description">
              Let members earn exclusive merchandise with their points. Limited edition
              gear that shows their VIP status. They become walking ambassadors for
              your brand—and they earned the right to rep it.
            </p>
            <ul className="feature-list">
              <li>Exclusive merch for point redemption</li>
              <li>Limited edition VIP-only items</li>
              <li>Status symbols they're proud to wear</li>
              <li>Turns customers into brand ambassadors</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card feature-card-pink">
              <div className="feature-card-header">
                <span className="feature-card-badge">VIP Reward</span>
              </div>
              <div className="feature-card-content">
                <div className="merch-display">
                  <span className="merch-icon">👕</span>
                  <span className="merch-name">Limited Edition Founder Hoodie</span>
                </div>
                <div className="merch-cost">
                  <span className="merch-points">5,000 pts</span>
                  <span className="merch-tag">VIP Exclusive</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Communication */}
        <div className="feature-block">
          <div className="feature-visual">
            <div className="feature-card feature-card-indigo">
              <div className="feature-card-header">
                <span className="feature-card-badge">Announcement</span>
              </div>
              <div className="feature-card-content">
                <div className="message-display">
                  <span className="message-title">Thank You, VIPs!</span>
                  <span className="message-body">You made our anniversary week special. Here's 100 bonus points on us.</span>
                </div>
                <div className="message-meta">
                  <span>Sent to 847 VIP members</span>
                </div>
              </div>
            </div>
          </div>
          <div className="feature-content">
            <div className="feature-icon feature-icon-indigo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3>Direct <span className="title-accent">Connection</span></h3>
            <p className="feature-description">
              Send personal thank-yous. Broadcast special announcements. Communicate
              directly with your community—individuals or groups. No algorithms,
              no ad spend. Just you and your people.
            </p>
            <ul className="feature-list">
              <li>Personal messages with rewards attached</li>
              <li>Broadcast to tiers or all members</li>
              <li>Special announcement campaigns</li>
              <li>Direct relationship, no middleman</li>
            </ul>
          </div>
        </div>

        {/* Verifiable Redemption */}
        <div className="feature-block feature-block-alt">
          <div className="feature-content">
            <div className="feature-icon feature-icon-teal">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3>Verifiable <span className="title-accent">Everything</span></h3>
            <p className="feature-description">
              QR-based redemption that's instant and verified. No arguments about
              "I think I had points." Everything is tracked, transparent, and on
              the blockchain. Trust built into every transaction.
            </p>
            <ul className="feature-list">
              <li>Scan QR to redeem—instant verification</li>
              <li>Blockchain-recorded transactions</li>
              <li>No disputes, no confusion</li>
              <li>Complete transaction history</li>
            </ul>
          </div>
          <div className="feature-visual">
            <div className="feature-card feature-card-teal">
              <div className="feature-card-header">
                <span className="feature-card-badge">Verified Redemption</span>
              </div>
              <div className="feature-card-content">
                <div className="verify-display">
                  <div className="verify-check">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="verify-text">Reward Claimed</span>
                  <span className="verify-item">Free Coffee — 100 pts</span>
                </div>
                <div className="verify-hash">
                  <span>Tx: 0x8f3a...2e1b</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
