import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { addEmailJob } from './email.job';

const reminderQueue = new Queue('reminder', {
  connection: redisClient,
});

export const scheduleReminder = async (reminderId: string, scheduledAt: Date) => {
  const delay = scheduledAt.getTime() - Date.now();
  if (delay > 0) {
    await reminderQueue.add(
      'send-reminder',
      { reminderId },
      {
        delay,
        attempts: 3,
      }
    );
  }
};

const reminderWorker = new Worker(
  'reminder',
  async (job) => {
    const { reminderId } = job.data;
    try {
      const reminder = await prisma.reminder.findUnique({
        where: { id: reminderId },
        include: {
          patient: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!reminder || reminder.status !== 'PENDING') {
        return;
      }

      await addEmailJob({
        to: reminder.patient.email,
        subject: `Reminder: ${reminder.title}`,
        html: `
          <h2>${reminder.title}</h2>
          <p>${reminder.description || ''}</p>
          <p>Scheduled for: ${reminder.scheduledAt.toLocaleString()}</p>
        `,
      });

      await prisma.reminder.update({
        where: { id: reminderId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      logger.info(`Reminder sent: ${reminderId}`);
    } catch (error) {
      logger.error(`Reminder job failed: ${error}`);
      throw error;
    }
  },
  {
    connection: redisClient,
  }
);

reminderWorker.on('completed', (job) => {
  logger.info(`Reminder job ${job.id} completed`);
});

reminderWorker.on('failed', (job, err) => {
  logger.error(`Reminder job ${job?.id} failed: ${err.message}`);
});

export default reminderQueue;

