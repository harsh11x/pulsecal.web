import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { v4 as uuidv4 } from 'uuid';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';
import { config } from './config/env';
import { logger } from './utils/logger';
import './config/firebase';

const app: Express = express();

// Trust Proxy (Required for Vercel/AWS Load Balancers)
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
    // Reduce noise in development
    autoLogging: config.nodeEnv === 'production',
  })
);

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin.includes(',')
      ? config.cors.origin.split(',').map(o => o.trim())
      : config.cors.origin,
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: HTTP Parameter Pollution
app.use(hpp());

app.use(apiRateLimiter);

app.use('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

