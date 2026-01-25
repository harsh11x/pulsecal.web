import dotenv from 'dotenv';


dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  apiVersion: string;
  databaseUrl: string;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  firebase: {
    projectId: string;
  };
  encryption: {
    key: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  aws: {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    s3Bucket?: string;
  };
  cors: {
    origin: string;
  };
  security: {
    bcryptRounds: number;
    sessionSecret: string;
    accountLockoutMaxAttempts: number;
    accountLockoutDurationMs: number;
    jwtSecret: string;
    jwtRefreshSecret: string;
  };
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
}

function getEnvVar(key: string, required: boolean = true, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && required && defaultValue === undefined) {
    throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

// Fail Fast Validation
try {
  getEnvVar('DATABASE_URL');
  getEnvVar('ENCRYPTION_KEY');
  getEnvVar('JWT_SECRET');
  getEnvVar('JWT_REFRESH_SECRET');
  // Add other critical vars here
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

export const config: EnvConfig = {
  nodeEnv: getEnvVar('NODE_ENV', false, 'development'),
  port: parseInt(getEnvVar('PORT', false, '3001'), 10),
  apiVersion: getEnvVar('API_VERSION', false, 'v1'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  redis: {
    host: getEnvVar('REDIS_HOST', false, 'localhost'),
    port: parseInt(getEnvVar('REDIS_PORT', false, '6379'), 10),
    password: getEnvVar('REDIS_PASSWORD', false, ''),
  },
  firebase: {
    projectId: getEnvVar('FIREBASE_PROJECT_ID', true), // Required for Auth
  },
  encryption: {
    key: getEnvVar('ENCRYPTION_KEY'),
  },
  email: {
    host: getEnvVar('SMTP_HOST', false, 'smtp.gmail.com'),
    port: parseInt(getEnvVar('SMTP_PORT', false, '587'), 10),
    user: getEnvVar('SMTP_USER', false),
    password: getEnvVar('SMTP_PASS', false),
    from: getEnvVar('SMTP_FROM', false, 'noreply@pulsecal.com'),
  },
  aws: {
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID', false),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY', false),
    region: getEnvVar('AWS_REGION', false),
    s3Bucket: getEnvVar('AWS_S3_BUCKET', false),
  },
  cors: {
    origin: getEnvVar('CORS_ORIGIN', false, 'http://localhost:3000,https://pulsecal.com,https://www.pulsecal.com'),
  },
  security: {
    bcryptRounds: parseInt(getEnvVar('BCRYPT_ROUNDS', false, '12'), 10),
    sessionSecret: getEnvVar('SESSION_SECRET', false, 'super-secret-session-key'), // Make required in prod
    accountLockoutMaxAttempts: parseInt(
      getEnvVar('ACCOUNT_LOCKOUT_MAX_ATTEMPTS', false, '5'),
      10
    ),
    accountLockoutDurationMs: parseInt(
      getEnvVar('ACCOUNT_LOCKOUT_DURATION_MS', false, '900000'),
      10
    ),
    jwtSecret: getEnvVar('JWT_SECRET'),
    jwtRefreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
  },
  razorpay: {
    keyId: getEnvVar('RAZORPAY_KEY_ID', false, 'rzp_test_placeholder'),
    keySecret: getEnvVar('RAZORPAY_KEY_SECRET', false, 'rzp_secret_placeholder'),
    webhookSecret: getEnvVar('RAZORPAY_WEBHOOK_SECRET', false, 'rzp_webhook_placeholder'),
  },
};

