
const Razorpay = require('razorpay');
require('dotenv').config({ path: './.env' });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

const plans = [
    {
        period: 'monthly',
        interval: 1,
        item: {
            name: 'Starter Plan',
            amount: 100, // ₹1
            currency: 'INR',
            description: 'Starter plan for small clinics (Up to 3 Doctors, 1000 Appointments)',
        },
        notes: { plan_type: 'STARTER' }
    },
    {
        period: 'monthly',
        interval: 1,
        item: {
            name: 'Professional Plan',
            amount: 299900, // ₹2999
            currency: 'INR',
            description: 'Professional plan for growing clinics (Up to 10 Doctors, Unlimited Appointments)',
        },
        notes: { plan_type: 'PROFESSIONAL' }
    },
    {
        period: 'monthly',
        interval: 1,
        item: {
            name: 'Enterprise Plan',
            amount: 499900, // ₹4999
            currency: 'INR',
            description: 'Enterprise solution (Unlimited Doctors)',
        },
        notes: { plan_type: 'ENTERPRISE' }
    }
];

async function createPlans() {
    console.log('Creating Razorpay Plans...');
    for (const plan of plans) {
        try {
            const response = await razorpay.plans.create(plan);
            console.log(`Created ${plan.notes.plan_type}: ${response.id}`);
        } catch (error) {
            console.error(`Failed to create ${plan.notes.plan_type}:`, error);
        }
    }
}

createPlans();
