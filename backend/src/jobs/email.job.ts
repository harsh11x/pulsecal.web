import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import { config } from '../config/env';

const emailQueue = new Queue('email', {
  connection: redisClient,
});

const emailTransporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export const addEmailJob = async (data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  await emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};

const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, html, text } = job.data;
    try {
      await emailTransporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
        text,
      });
      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error(`Email sending failed: ${error}`);
      throw error;
    }
  },
  {
    connection: redisClient,
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed: ${err.message}`);
});

export default emailQueue;

