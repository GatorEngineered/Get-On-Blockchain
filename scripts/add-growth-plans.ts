// scripts/add-growth-plans.ts
/**
 * Add Growth Plans to existing PayPal Product
 *
 * Run with: npx tsx scripts/add-growth-plans.ts
 *
 * This adds:
 * - Growth Monthly ($249/mo with 7-day trial)
 * - Growth Annual ($2490/year)
 *
 * Requires PAYPAL_PRODUCT_ID to be set in .env
 */

// IMPORTANT: Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// For ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
const envPath = resolve(__dirname, '../.env');
config({ path: envPath });

console.log(`Loading environment from: ${envPath}`);
console.log(`PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? 'Set' : 'NOT SET'}`);
console.log(`PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'Set' : 'NOT SET'}`);
console.log(`PAYPAL_PRODUCT_ID: ${process.env.PAYPAL_PRODUCT_ID ? 'Set' : 'NOT SET'}`);
console.log('');

async function addGrowthPlans() {
  const productId = process.env.PAYPAL_PRODUCT_ID;

  if (!productId) {
    console.error('ERROR: PAYPAL_PRODUCT_ID is not set in .env');
    console.error('Please run the full setup script first or set PAYPAL_PRODUCT_ID manually.');
    process.exit(1);
  }

  // Use dynamic import to ensure env vars are loaded first
  const {
    createPlan,
    createTrialBillingCycles,
    createAnnualBillingCycle,
  } = await import('../src/app/lib/paypal/subscriptions.js');

  console.log('Adding Growth Plans to PayPal...\n');
  console.log('='.repeat(60));
  console.log(`Using Product ID: ${productId}\n`);

  try {
    const plans = [];

    // Plan 1: Growth Monthly ($249/mo with 7-day trial)
    console.log('Creating Growth Monthly plan...');
    const growthMonthly = await createPlan({
      product_id: productId,
      name: 'Growth Monthly',
      description: 'Growth plan - $249/month with 7-day free trial. Includes branded loyalty token.',
      billing_cycles: createTrialBillingCycles('249.00'),
    });
    plans.push(growthMonthly);
    console.log(`Growth Monthly: ${growthMonthly.id}`);

    // Plan 2: Growth Annual ($2490/year - save $498)
    console.log('Creating Growth Annual plan...');
    const growthAnnual = await createPlan({
      product_id: productId,
      name: 'Growth Annual',
      description: 'Growth plan - $2490/year (save $498 vs monthly). Includes branded loyalty token.',
      billing_cycles: createAnnualBillingCycle('2490.00'),
    });
    plans.push(growthAnnual);
    console.log(`Growth Annual: ${growthAnnual.id}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Growth Plans Created!\n');

    console.log('Plan IDs:');
    plans.forEach((plan) => {
      console.log(`   ${plan.name.padEnd(20)} ${plan.id}`);
    });

    console.log('\nAdd these to your .env file:');
    console.log(`   PAYPAL_PLAN_GROWTH_MONTHLY="${plans[0].id}"`);
    console.log(`   PAYPAL_PLAN_GROWTH_ANNUAL="${plans[1].id}"`);
    console.log('\n' + '='.repeat(60));
  } catch (error: any) {
    console.error('\nSetup failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

addGrowthPlans()
  .then(() => {
    console.log('\nDone!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
