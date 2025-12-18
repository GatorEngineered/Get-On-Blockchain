'use client';

import React from 'react';
import styles from '@/app/styles/dashboard-mockups.module.css';

 

type Transaction = {

  id: string;

  date: string;

  description: string;

  points: number;

  location: string;

  type: 'EARNED' | 'REDEEMED';

};

 

type Reward = {

  id: string;

  name: string;

  points: number;

  description: string;

};

 

type CustomerDashboardProps = {

  customer: {

    name: string;

    email?: string;

    pointsBalance: number;

    tierLevel: string;

  };

  transactions: Transaction[];

  availableRewards: Reward[];

  qrCode?: string;

};

 

export default function CustomerDashboard({

  customer,

  transactions,

  availableRewards,

  qrCode

}: CustomerDashboardProps) {

  // Calculate next reward for progress bar

  const nextReward = availableRewards

    .filter(r => r.points > customer.pointsBalance)

    .sort((a, b) => a.points - b.points)[0];

 

  const progressPercentage = nextReward

    ? (customer.pointsBalance / nextReward.points) * 100

    : 100;

 

  return (

    <div className={styles.mockupContainer}>

      {/* Header Section */}

      <div className={styles.customerHeader}>

        <div className={styles.customerWelcome}>

          <h1>Welcome back, {customer.name}!</h1>

          <p className={styles.tierBadge}>

            <span className={styles.tierIcon}>★</span> {customer.tierLevel} Member

          </p>

        </div>

      </div>

 

      {/* Points Balance Card */}

      <div className={styles.pointsCard}>

        <div className={styles.pointsCardContent}>

          <div className={styles.pointsBalance}>

            <p className={styles.pointsLabel}>Your Points</p>

            <h2 className={styles.pointsNumber}>{customer.pointsBalance}</h2>

          </div>

 

          {nextReward && (

            <div className={styles.progressSection}>

              <div className={styles.progressHeader}>

                <span className={styles.progressLabel}>Progress to next reward</span>

                <span className={styles.progressPoints}>

                  {customer.pointsBalance} / {nextReward.points}

                </span>

              </div>

              <div className={styles.progressBar}>

                <div

                  className={styles.progressFill}

                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}

                />

              </div>

              <p className={styles.pointsRemaining}>

                {nextReward.points - customer.pointsBalance} points until {nextReward.name}

              </p>

            </div>

          )}

        </div>

      </div>

 

      {/* Available Rewards */}

      <div className={styles.section}>

        <h3 className={styles.sectionTitle}>Available Rewards</h3>

        <div className={styles.rewardsGrid}>

          {availableRewards.map((reward) => {

            const canRedeem = customer.pointsBalance >= reward.points;

            return (

              <div

                key={reward.id}

                className={`${styles.rewardCard} ${canRedeem ? styles.rewardCardActive : styles.rewardCardInactive}`}

              >

                <div className={styles.rewardHeader}>

                  <h4 className={styles.rewardName}>{reward.name}</h4>

                  <span className={styles.rewardPoints}>{reward.points} pts</span>

                </div>

                <p className={styles.rewardDescription}>{reward.description}</p>

                <button

                  className={`${styles.redeemButton} ${canRedeem ? '' : styles.redeemButtonDisabled}`}

                  disabled={!canRedeem}

                >

                  {canRedeem ? 'Redeem Now' : 'Not Enough Points'}

                </button>

              </div>

            );

          })}

        </div>

      </div>

 

      {/* Transaction History */}

      <div className={styles.section}>

        <h3 className={styles.sectionTitle}>Recent Activity</h3>

        <div className={styles.transactionList}>

          {transactions.length > 0 ? (

            transactions.map((transaction) => (

              <div key={transaction.id} className={styles.transactionItem}>

                <div className={styles.transactionIcon}>

                  {transaction.type === 'EARNED' ? (

                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

                    </svg>

                  ) : (

                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />

                    </svg>

                  )}

                </div>

                <div className={styles.transactionDetails}>

                  <p className={styles.transactionDescription}>{transaction.description}</p>

                  <p className={styles.transactionMeta}>

                    {new Date(transaction.date).toLocaleDateString()} • {transaction.location}

                  </p>

                </div>

                <div className={`${styles.transactionPoints} ${transaction.type === 'EARNED' ? styles.pointsEarned : styles.pointsRedeemed}`}>

                  {transaction.type === 'EARNED' ? '+' : '-'}{transaction.points}

                </div>

              </div>

            ))

          ) : (

            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>

              No transactions yet

            </p>

          )}

        </div>

      </div>

 

      {/* QR Code Section */}

      <div className={styles.qrSection}>

        <div className={styles.qrCard}>

          <h4 className={styles.qrTitle}>Scan to Earn Points</h4>

          <div className={styles.qrPlaceholder}>

            {qrCode ? (

              <img

                src={qrCode}

                alt="Customer QR Code"

                style={{ width: '200px', height: '200px', borderRadius: '0.8rem' }}

              />

            ) : (

              <div className={styles.qrCodeMockup}>

                {/* Simple QR code visual mockup */}

                <div className={styles.qrPattern}></div>

              </div>

            )}

          </div>

          <p className={styles.qrInstructions}>

            Show this code at checkout to earn points

          </p>

          {customer.email && (

            <p className={styles.qrInstructions} style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>

              {customer.email}

            </p>

          )}

        </div>

      </div>

    </div>

  );

}

 