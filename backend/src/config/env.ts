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
    projectId?: string;
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
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  security: {
    bcryptRounds: number;
    sessionSecret: string;
    accountLockoutMaxAttempts: number;
    accountLockoutDurationMs: number;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

export const config: EnvConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '3001'), 10),
  apiVersion: getEnvVar('API_VERSION', 'v1'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: parseInt(getEnvVar('REDIS_PORT', '6379'), 10),
    password: getEnvVar('REDIS_PASSWORD', undefined),
  },
  firebase: {
    projectId: getEnvVar('FIREBASE_PROJECT_ID', undefined),
  },
  encryption: {
    key: getEnvVar('ENCRYPTION_KEY'),
  },
  email: {
    host: getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(getEnvVar('SMTP_PORT', '587'), 10),
    user: getEnvVar('SMTP_USER'),
    password: getEnvVar('SMTP_PASS'),
    from: getEnvVar('SMTP_FROM', 'noreply@pulsecal.com'),
  },
  aws: {
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID', undefined),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY', undefined),
    region: getEnvVar('AWS_REGION', undefined),
    s3Bucket: getEnvVar('AWS_S3_BUCKET', undefined),
  },
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
  },
  rateLimit: {
    windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    maxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },
  security: {
    bcryptRounds: parseInt(getEnvVar('BCRYPT_ROUNDS', '12'), 10),
    sessionSecret: getEnvVar('SESSION_SECRET'),
    accountLockoutMaxAttempts: parseInt(
      getEnvVar('ACCOUNT_LOCKOUT_MAX_ATTEMPTS', '5'),
      10
    ),
    accountLockoutDurationMs: parseInt(
      getEnvVar('ACCOUNT_LOCKOUT_DURATION_MS', '900000'),
      10
    ),
  },
};

