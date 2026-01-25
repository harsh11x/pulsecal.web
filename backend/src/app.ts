import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { config } from './config/env';
import { logger } from './utils/logger';
import './config/firebase';

const app: Express = express();

// Trust Proxy (Required for AWS Load Balancers)
app.set('trust proxy', 1);

// Request ID Injection
app.use((req, _res, next) => {
  req.id = uuidv4();
  next();
});

// Structured Logging
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id || uuidv4(),
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip,
      }),
    },
    autoLogging: config.nodeEnv === 'production',
  })
);

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = config.cors.origin.includes(',')
  ? config.cors.origin.split(',').map((origin) => origin.trim())
  : [config.cors.origin];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: HTTP Parameter Pollution
app.use(hpp());

// Health Check
app.use('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use(routes);

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
