
const Razorpay = require('razorpay');
require('dotenv').config({ path: './.env' });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

const plans = [
    {
        key: 'BASIC',
        period: 'monthly',
        interval: 1,
        item: {
            name: 'PulseCal Basic Monthly',
            amount: 149900, // ₹1499
            currency: 'INR',
            description: 'Basic plan for small clinics (Up to 3 Doctors)',
        },
        notes: { plan_type: 'BASIC', billing_cycle: 'MONTHLY' }
    },
    {
        key: 'PROFESSIONAL',
        period: 'monthly',
        interval: 1,
        item: {
            name: 'PulseCal Professional Monthly',
            amount: 299900, // ₹2999
            currency: 'INR',
            description: 'Professional plan for growing clinics (Up to 10 Doctors, Unlimited Appointments)',
        },
        notes: { plan_type: 'PROFESSIONAL', billing_cycle: 'MONTHLY' }
    },
    {
        key: 'ENTERPRISE',
        period: 'monthly',
        interval: 1,
        item: {
            name: 'PulseCal Enterprise Monthly',
            amount: 499900, // ₹4999
            currency: 'INR',
            description: 'Enterprise solution (Unlimited Doctors)',
        },
        notes: { plan_type: 'ENTERPRISE', billing_cycle: 'MONTHLY' }
    }
];

async function createPlans() {
    console.log('Creating Razorpay Plans...');
    for (const plan of plans) {
        try {
            const { key, ...payload } = plan;
            const response = await razorpay.plans.create(payload);
            console.log(`RAZORPAY_PLAN_${key}=${response.id}`);
        } catch (error) {
            console.error(`Failed to create ${plan.notes.plan_type}:`, error);
        }
    }
}

createPlans();
