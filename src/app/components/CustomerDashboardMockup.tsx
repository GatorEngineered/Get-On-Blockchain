'use client';

 

import React from 'react';

import styles from '../styles/dashboard-mockups.module.css';

 

export default function CustomerDashboardMockup() {

  // Sample data for mockup

  const customerData = {

    name: "Sarah Johnson",

    pointsBalance: 485,

    nextReward: 500,

    tierLevel: "Gold",

    transactions: [

      { id: 1, date: "2025-01-12", description: "Morning Coffee Purchase", points: +25, location: "Downtown" },

      { id: 2, date: "2025-01-10", description: "Pastry & Latte", points: +35, location: "Main Street" },

      { id: 3, date: "2025-01-08", description: "Redeemed: Free Coffee", points: -100, location: "Downtown" },

      { id: 4, date: "2025-01-05", description: "Espresso & Muffin", points: +30, location: "Downtown" },

      { id: 5, date: "2025-01-03", description: "Coffee Beans (1lb)", points: +50, location: "Main Street" },

      { id: 6, date: "2024-12-28", description: "Holiday Blend Purchase", points: +45, location: "Downtown" },

    ],

    availableRewards: [

      { id: 1, name: "Free Coffee", points: 100, description: "Any size, any blend" },

      { id: 2, name: "Free Pastry", points: 150, description: "Choose from daily selection" },

      { id: 3, name: "10% Off Purchase", points: 200, description: "Valid on any purchase" },

      { id: 4, name: "Free Bag of Beans", points: 500, description: "12oz of house blend" },

    ]

  };

 

  const progressPercentage = (customerData.pointsBalance / customerData.nextReward) * 100;

 

  return (

    <div className={styles.mockupContainer}>

      {/* Header Section */}

      <div className={styles.customerHeader}>

        <div className={styles.customerWelcome}>

          <h1>Welcome back, {customerData.name}!</h1>

          <p className={styles.tierBadge}>

            <span className={styles.tierIcon}>★</span> {customerData.tierLevel} Member

          </p>

        </div>

      </div>

 

      {/* Points Balance Card */}

      <div className={styles.pointsCard}>

        <div className={styles.pointsCardContent}>

          <div className={styles.pointsBalance}>

            <p className={styles.pointsLabel}>Your Points</p>

            <h2 className={styles.pointsNumber}>{customerData.pointsBalance}</h2>

          </div>

 

          <div className={styles.progressSection}>

            <div className={styles.progressHeader}>

              <span className={styles.progressLabel}>Progress to next reward</span>

              <span className={styles.progressPoints}>{customerData.pointsBalance} / {customerData.nextReward}</span>

            </div>

            <div className={styles.progressBar}>

              <div

                className={styles.progressFill}

                style={{ width: `${progressPercentage}%` }}

              />

            </div>

            <p className={styles.pointsRemaining}>

              {customerData.nextReward - customerData.pointsBalance} points until Free Bag of Beans

            </p>

          </div>

        </div>

      </div>

 

      {/* Available Rewards */}

      <div className={styles.section}>

        <h3 className={styles.sectionTitle}>Available Rewards</h3>

        <div className={styles.rewardsGrid}>

          {customerData.availableRewards.map((reward) => {

            const canRedeem = customerData.pointsBalance >= reward.points;

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

          {customerData.transactions.map((transaction) => (

            <div key={transaction.id} className={styles.transactionItem}>

              <div className={styles.transactionIcon}>

                {transaction.points > 0 ? (

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

                  {transaction.date} • {transaction.location}

                </p>

              </div>

              <div className={`${styles.transactionPoints} ${transaction.points > 0 ? styles.pointsEarned : styles.pointsRedeemed}`}>

                {transaction.points > 0 ? '+' : ''}{transaction.points}

              </div>

            </div>

          ))}

        </div>

      </div>

 

      {/* QR Code Section */}

      <div className={styles.qrSection}>

        <div className={styles.qrCard}>

          <h4 className={styles.qrTitle}>Scan to Earn Points</h4>

          <div className={styles.qrPlaceholder}>

            <div className={styles.qrCodeMockup}>

              {/* Simple QR code visual mockup */}

              <div className={styles.qrPattern}></div>

            </div>

          </div>

          <p className={styles.qrInstructions}>

            Show this code at checkout to earn points

          </p>

        </div>

      </div>

    </div>

  );

}

 