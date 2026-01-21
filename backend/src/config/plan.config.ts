export const PLAN_CONFIG = {
    STARTER: {
        maxDoctors: 3,
        clinicLocations: 1,
        maxAppointments: 1000,
        features: {
            RECEPTIONIST_ACCESS: false,
            QUEUE_MANAGEMENT: false,
            DIGITAL_PRESCRIPTIONS: 'BASIC',
            MEDICAL_RECORDS: true,
            ANALYTICS: false,
            CUSTOM_BRANDING: true,
            EMAIL_ACCESS: true,
            MOBILE_APP_ACCESS: true,
        },
    },
    BASIC: {
        maxDoctors: 5,
        clinicLocations: 1,
        maxAppointments: 2000,
        features: {
            RECEPTIONIST_ACCESS: false,
            QUEUE_MANAGEMENT: false,
            DIGITAL_PRESCRIPTIONS: 'FULL',
            MEDICAL_RECORDS: true,
            ANALYTICS: 'BASIC',
            CUSTOM_BRANDING: false,
            EMAIL_ACCESS: true,
            MOBILE_APP_ACCESS: true,
        },
    },
    PROFESSIONAL: {
        maxDoctors: 10,
        clinicLocations: 2,
        maxAppointments: Infinity,
        features: {
            RECEPTIONIST_ACCESS: true,
            QUEUE_MANAGEMENT: true,
            DIGITAL_PRESCRIPTIONS: 'FULL',
            MEDICAL_RECORDS: true,
            ANALYTICS: 'FULL',
            CUSTOM_BRANDING: true,
            EMAIL_ACCESS: true,
            MOBILE_APP_ACCESS: true,
        },
    },
    ENTERPRISE: {
        maxDoctors: Infinity,
        clinicLocations: Infinity,
        maxAppointments: Infinity,
        features: {
            RECEPTIONIST_ACCESS: true,
            QUEUE_MANAGEMENT: true,
            DIGITAL_PRESCRIPTIONS: 'FULL',
            MEDICAL_RECORDS: true,
            ANALYTICS: 'EXPORT',
            CUSTOM_BRANDING: true,
            EMAIL_ACCESS: true,
            MOBILE_APP_ACCESS: true,
        },
    },
};

export type SubscriptionPlan = keyof typeof PLAN_CONFIG;
export type FeatureName = keyof typeof PLAN_CONFIG.STARTER.features;
