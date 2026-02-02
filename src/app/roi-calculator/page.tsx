"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";
import { useSearchParams } from "next/navigation";
import styles from "./calculator.module.css";

const industryDefaults = {
  restaurants: {
    avgTransaction: 20,
    dailyCustomers: 50,
    repeatRate: 20,
    planCost: 149,
  },
  retail: {
    avgTransaction: 50,
    dailyCustomers: 100,
    repeatRate: 25,
    planCost: 55,
  },
  fitness: {
    avgTransaction: 150,
    dailyCustomers: 200,
    repeatRate: 15,
    planCost: 149,
  },
  salons: {
    avgTransaction: 75,
    dailyCustomers: 150,
    repeatRate: 30,
    planCost: 55,
  },
  default: {
    avgTransaction: 35,
    dailyCustomers: 100,
    repeatRate: 20,
    planCost: 55,
  },
};

export default function ROICalculatorPage() {
  const searchParams = useSearchParams();
  const industry = searchParams?.get("industry") || "default";

  const defaults = industryDefaults[industry as keyof typeof industryDefaults] || industryDefaults.default;

  const [avgTransaction, setAvgTransaction] = useState(defaults.avgTransaction);
  const [dailyCustomers, setDailyCustomers] = useState(defaults.dailyCustomers);
  const [repeatRate, setRepeatRate] = useState(defaults.repeatRate);
  const [planCost, setPlanCost] = useState(defaults.planCost);

  // Calculations
  const monthlyCustomers = dailyCustomers * 30;
  const newRepeaters = Math.round(monthlyCustomers * (repeatRate / 100));
  const extraVisitsPerMonth = newRepeaters;
  const monthlyRevenue = extraVisitsPerMonth * avgTransaction;
  const annualRevenue = monthlyRevenue * 12;
  const annualCost = planCost * 12;
  const netGain = annualRevenue - annualCost;
  const roi = annualCost > 0 ? Math.round((netGain / annualCost) * 100) : 0;

  return (
    <main className={styles.calculatorPage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <h1>Loyalty Program ROI Calculator</h1>
          <p>
            See exactly how much revenue you could gain with a loyalty rewards program.
            Adjust the numbers to match your business.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className={styles.calculator}>
        <div className={styles.calculatorInner}>
          <div className={styles.calculatorGrid}>
            {/* Inputs */}
            <div className={styles.inputs}>
              <h2>Your Business Numbers</h2>

              <div className={styles.inputGroup}>
                <label htmlFor="avgTransaction">
                  Average Transaction Value
                  <span className={styles.tooltip}>💡 Average amount per sale/visit</span>
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.currency}>$</span>
                  <input
                    id="avgTransaction"
                    type="number"
                    min="1"
                    value={avgTransaction}
                    onChange={(e) => setAvgTransaction(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="dailyCustomers">
                  Daily Customers
                  <span className={styles.tooltip}>💡 How many customers per day</span>
                </label>
                <input
                  id="dailyCustomers"
                  type="number"
                  min="1"
                  value={dailyCustomers}
                  onChange={(e) => setDailyCustomers(Number(e.target.value))}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="repeatRate">
                  Expected Repeat Customer Increase (%)
                  <span className={styles.tooltip}>
                    💡 Industry average: 20-30% more repeat visits
                  </span>
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="repeatRate"
                    type="number"
                    min="1"
                    max="100"
                    value={repeatRate}
                    onChange={(e) => setRepeatRate(Number(e.target.value))}
                  />
                  <span className={styles.percent}>%</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>
                  Monthly Plan
                  <span className={styles.tooltip}>💡 Choose your plan tier</span>
                </label>
                <div className={styles.planToggle}>
                  <button
                    type="button"
                    className={planCost === 55 ? styles.planToggleActive : styles.planToggleInactive}
                    onClick={() => setPlanCost(55)}
                  >
                    Basic - $55/mo
                  </button>
                  <button
                    type="button"
                    className={planCost === 149 ? styles.planToggleActive : styles.planToggleInactive}
                    onClick={() => setPlanCost(149)}
                  >
                    Premium - $149/mo
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className={styles.results}>
              <h2>Your Projected Results</h2>

              <div className={styles.resultCard}>
                <div className={styles.resultStat}>
                  <span className={styles.resultLabel}>Extra Visits Per Month</span>
                  <span className={styles.resultValue}>{extraVisitsPerMonth.toLocaleString()}</span>
                </div>

                <div className={styles.resultStat}>
                  <span className={styles.resultLabel}>Monthly Revenue Increase</span>
                  <span className={styles.resultValue}>
                    ${monthlyRevenue.toLocaleString()}
                  </span>
                </div>

                <div className={styles.resultStat}>
                  <span className={styles.resultLabel}>Annual Revenue Increase</span>
                  <span className={styles.resultValue}>
                    ${annualRevenue.toLocaleString()}
                  </span>
                </div>

                <div className={styles.resultStat}>
                  <span className={styles.resultLabel}>Annual Plan Cost</span>
                  <span className={styles.resultValue}>
                    ${annualCost.toLocaleString()}
                  </span>
                </div>

                <div className={styles.resultHighlight}>
                  <span className={styles.resultLabel}>Net Annual Gain</span>
                  <span className={styles.resultValueLarge}>
                    ${netGain.toLocaleString()}
                  </span>
                </div>

                <div className={styles.roiHighlight}>
                  <span className={styles.roiLabel}>Return on Investment</span>
                  <span className={styles.roiValue}>{roi}x</span>
                  <p className={styles.roiExplanation}>
                    For every $1 you invest, you get ${roi} back
                  </p>
                </div>
              </div>

              <div className={styles.ctas}>
                <a href="/pricing" className={styles.ctaPrimary}>
                  Get Started - ${planCost}/month
                </a>
                <a href="/pricing#features" className={styles.ctaSecondary}>
                  View Plan Details
                </a>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className={styles.breakdown}>
            <h3>How We Calculate Your ROI</h3>
            <div className={styles.breakdownSteps}>
              <div className={styles.breakdownStep}>
                <span className={styles.stepNumber}>1</span>
                <p>
                  <strong>{monthlyCustomers.toLocaleString()} monthly customers</strong>
                  <br />
                  {dailyCustomers} daily customers × 30 days
                </p>
              </div>
              <div className={styles.breakdownStep}>
                <span className={styles.stepNumber}>2</span>
                <p>
                  <strong>{newRepeaters.toLocaleString()} become repeat customers</strong>
                  <br />
                  {monthlyCustomers.toLocaleString()} customers × {repeatRate}% increase
                </p>
              </div>
              <div className={styles.breakdownStep}>
                <span className={styles.stepNumber}>3</span>
                <p>
                  <strong>{extraVisitsPerMonth.toLocaleString()} extra visits per month</strong>
                  <br />
                  Each new repeater visits once more
                </p>
              </div>
              <div className={styles.breakdownStep}>
                <span className={styles.stepNumber}>4</span>
                <p>
                  <strong>${monthlyRevenue.toLocaleString()} monthly revenue boost</strong>
                  <br />
                  {extraVisitsPerMonth.toLocaleString()} visits × ${avgTransaction} average
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className={styles.socialProof}>
        <div className={styles.socialProofInner}>
          <h2>Real Results from Real Businesses</h2>
          <div className={styles.testimonials}>
            <div className={styles.testimonial}>
              <p className={styles.quote}>
                "We saw a 35% increase in repeat visits within 2 months. Best investment we've made."
              </p>
              <p className={styles.author}>— Coffee shop owner, Tampa FL</p>
            </div>
            <div className={styles.testimonial}>
              <p className={styles.quote}>
                "Our customers love the rewards. We've filled gaps in our schedule with regulars."
              </p>
              <p className={styles.author}>— Salon owner, Austin TX</p>
            </div>
            <div className={styles.testimonial}>
              <p className={styles.quote}>
                "40x ROI in the first year. I wish we'd started this sooner."
              </p>
              <p className={styles.author}>— Boutique fitness studio, Seattle WA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Loyalty Program ROI Calculator",
            description: "Calculate your return on investment from implementing a customer loyalty rewards program.",
            applicationCategory: "BusinessApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
    </main>
  );
}
