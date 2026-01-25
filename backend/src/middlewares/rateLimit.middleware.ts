import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Trust proxy is enabled in Express (app.set('trust proxy', 1))
  // This tells rate limiter to acknowledge and work with it
  validate: {
    trustProxy: true,
  },
  // Use a key generator that works with proxy headers
  keyGenerator: (req) => {
    // Get IP from X-Forwarded-For header (when behind proxy) or direct connection
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0])
      : req.ip || req.socket.remoteAddress || 'unknown';
    return ip;
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  validate: {
    trustProxy: true,
  },
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0])
      : req.ip || req.socket.remoteAddress || 'unknown';
    return ip;
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many requests, please try again later.',
  validate: {
    trustProxy: true,
  },
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0])
      : req.ip || req.socket.remoteAddress || 'unknown';
    return ip;
  },
});

