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

// Version check endpoint
app.get('/version', (_req, res) => {
  res.json({ version: '2.0.1', deployed: new Date().toISOString(), noValidation: true });
});

// Request ID Injection
app.use((req, _res, next) => {
  req.id = uuidv4();
  next();
});

// Request Logging Middleware (logs ALL incoming requests)
app.use((req, res, next) => {
  const start = Date.now();
  const requestInfo = {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    authorization: req.get('authorization') ? 'Present' : 'Missing',
  };
  
  // Log to console (PM2 will capture this)
  console.log(`[REQUEST] ${req.method} ${req.path}`, JSON.stringify(requestInfo));
  logger.info(requestInfo, `Incoming request: ${req.method} ${req.path}`);
  
  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[RESPONSE] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    logger.info(
      {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      },
      `Request completed: ${req.method} ${req.path}`
    );
  });
  
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
