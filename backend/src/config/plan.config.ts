export const PLAN_CONFIG = {
    STARTER: {
        maxDoctors: 1,
        clinicLocations: 1,
        features: {
            RECEPTIONIST_ACCESS: false,
            QUEUE_MANAGEMENT: false,
            DIGITAL_PRESCRIPTIONS: 'BASIC',
            MEDICAL_RECORDS: false,
            ANALYTICS: false,
        },
    },
    BASIC: {
        maxDoctors: 3,
        clinicLocations: 1,
        features: {
            RECEPTIONIST_ACCESS: false,
            QUEUE_MANAGEMENT: false,
            DIGITAL_PRESCRIPTIONS: 'FULL',
            MEDICAL_RECORDS: true,
            ANALYTICS: 'BASIC',
        },
    },
    PROFESSIONAL: {
        maxDoctors: 5,
        clinicLocations: 2,
        features: {
            RECEPTIONIST_ACCESS: true,
            QUEUE_MANAGEMENT: true,
            DIGITAL_PRESCRIPTIONS: 'FULL',
            MEDICAL_RECORDS: true,
            ANALYTICS: 'FULL',
        },
    },
    ENTERPRISE: {
        maxDoctors: 9999, // Unlimited
        clinicLocations: 9999, // Unlimited
        features: {
            RECEPTIONIST_ACCESS: true,
            QUEUE_MANAGEMENT: true,
            DIGITAL_PRESCRIPTIONS: 'FULL',
            MEDICAL_RECORDS: true,
            ANALYTICS: 'EXPORT',
        },
    },
};

export type SubscriptionPlan = keyof typeof PLAN_CONFIG;
export type FeatureName = keyof typeof PLAN_CONFIG.STARTER.features;
