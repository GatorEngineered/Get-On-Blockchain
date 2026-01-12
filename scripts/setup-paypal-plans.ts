// scripts/setup-paypal-plans.ts
/**
 * Setup PayPal Products and Plans
 *
 * Run with: npx tsx scripts/setup-paypal-plans.ts
 *
 * This creates:
 * - 1 Product: "GetOnBlockchain Loyalty Platform"
 * - 6 Plans: Basic Monthly ($49), Premium Monthly ($99), Growth Monthly ($149),
 *            Basic Annual ($490), Premium Annual ($990), Growth Annual ($1490)
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

console.log(`📁 Loading environment from: ${envPath}`);
console.log(`✅ PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? 'Set' : 'NOT SET'}`);
console.log(`✅ PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'Set' : 'NOT SET'}`);
console.log('');

async function setupPayPalPlans() {
  // Use dynamic import to ensure env vars are loaded first
  const {
    createProduct,
    createPlan,
    createTrialBillingCycles,
    createAnnualBillingCycle,
  } = await import('../src/app/lib/paypal/subscriptions.js');
  console.log('🚀 Setting up PayPal Products and Plans...\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create Product
    console.log('\n📦 Step 1: Creating Product...');
    const product = await createProduct({
      name: 'GetOnBlockchain Loyalty Platform',
      description: 'Web3-powered loyalty rewards platform with USDC payouts and multi-location support',
      type: 'SERVICE',
      category: 'SOFTWARE',
      home_url: 'https://getonblockchain.com',
    });

    console.log(`✅ Product created: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Type: ${product.type}`);

    // Step 2: Create Plans
    console.log('\n💳 Step 2: Creating Plans...\n');

    const plans = [];

    // Plan 1: Basic Monthly ($49/mo with 7-day trial)
    console.log('Creating Basic Monthly plan...');
    const basicMonthly = await createPlan({
      product_id: product.id,
      name: 'Basic Monthly',
      description: 'Basic plan - $49/month with 7-day free trial',
      billing_cycles: createTrialBillingCycles('49.00'),
    });
    plans.push(basicMonthly);
    console.log(`✅ Basic Monthly: ${basicMonthly.id}`);

    // Plan 2: Premium Monthly ($99/mo with 7-day trial)
    console.log('Creating Premium Monthly plan...');
    const premiumMonthly = await createPlan({
      product_id: product.id,
      name: 'Premium Monthly',
      description: 'Premium plan - $99/month with 7-day free trial',
      billing_cycles: createTrialBillingCycles('99.00'),
    });
    plans.push(premiumMonthly);
    console.log(`✅ Premium Monthly: ${premiumMonthly.id}`);

    // Plan 3: Basic Annual ($490/year - save $98)
    console.log('Creating Basic Annual plan...');
    const basicAnnual = await createPlan({
      product_id: product.id,
      name: 'Basic Annual',
      description: 'Basic plan - $490/year (save $98 vs monthly)',
      billing_cycles: createAnnualBillingCycle('490.00'),
    });
    plans.push(basicAnnual);
    console.log(`✅ Basic Annual: ${basicAnnual.id}`);

    // Plan 4: Premium Annual ($990/year - save $198)
    console.log('Creating Premium Annual plan...');
    const premiumAnnual = await createPlan({
      product_id: product.id,
      name: 'Premium Annual',
      description: 'Premium plan - $990/year (save $198 vs monthly)',
      billing_cycles: createAnnualBillingCycle('990.00'),
    });
    plans.push(premiumAnnual);
    console.log(`✅ Premium Annual: ${premiumAnnual.id}`);

    // Plan 5: Growth Monthly ($149/mo with 7-day trial)
    console.log('Creating Growth Monthly plan...');
    const growthMonthly = await createPlan({
      product_id: product.id,
      name: 'Growth Monthly',
      description: 'Growth plan - $149/month with 7-day free trial',
      billing_cycles: createTrialBillingCycles('149.00'),
    });
    plans.push(growthMonthly);
    console.log(`✅ Growth Monthly: ${growthMonthly.id}`);

    // Plan 6: Growth Annual ($1490/year - save $298)
    console.log('Creating Growth Annual plan...');
    const growthAnnual = await createPlan({
      product_id: product.id,
      name: 'Growth Annual',
      description: 'Growth plan - $1490/year (save $298 vs monthly)',
      billing_cycles: createAnnualBillingCycle('1490.00'),
    });
    plans.push(growthAnnual);
    console.log(`✅ Growth Annual: ${growthAnnual.id}`);

    // Step 3: Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Setup Complete!\n');

    console.log('📋 Product ID:');
    console.log(`   ${product.id}\n`);

    console.log('📋 Plan IDs:');
    plans.forEach((plan) => {
      console.log(`   ${plan.name.padEnd(20)} ${plan.id}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('   1. Add these IDs to your .env file:');
    console.log(`      PAYPAL_PRODUCT_ID="${product.id}"`);
    console.log(`      PAYPAL_PLAN_BASIC_MONTHLY="${plans[0].id}"`);
    console.log(`      PAYPAL_PLAN_PREMIUM_MONTHLY="${plans[1].id}"`);
    console.log(`      PAYPAL_PLAN_BASIC_ANNUAL="${plans[2].id}"`);
    console.log(`      PAYPAL_PLAN_PREMIUM_ANNUAL="${plans[3].id}"`);
    console.log(`      PAYPAL_PLAN_GROWTH_MONTHLY="${plans[4].id}"`);
    console.log(`      PAYPAL_PLAN_GROWTH_ANNUAL="${plans[5].id}"`);
    console.log('\n   2. Test subscription creation in your app');
    console.log('   3. Set up webhook URL in PayPal dashboard');
    console.log('\n' + '='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

setupPayPalPlans()
  .then(() => {
    console.log('\n✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
