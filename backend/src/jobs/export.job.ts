import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

const exportQueue = new Queue('export', {
  connection: redisClient,
});

export const addExportJob = async (data: {
  userId: string;
  exportType: string;
  data: unknown;
  fileUrl: string;
}) => {
  await exportQueue.add('process-export', data, {
    attempts: 2,
  });
};

const exportWorker = new Worker(
  'export',
  async (job) => {
    const { userId, exportType, data: exportData, fileUrl } = job.data;
    try {
      const exportsDir = path.join(process.cwd(), 'exports');
      await fs.mkdir(exportsDir, { recursive: true });

      const filePath = path.join(exportsDir, path.basename(fileUrl));
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));

      logger.info(`Export completed: ${filePath}`);
    } catch (error) {
      logger.error(`Export job failed: ${error}`);
      throw error;
    }
  },
  {
    connection: redisClient,
  }
);

exportWorker.on('completed', (job) => {
  logger.info(`Export job ${job.id} completed`);
});

exportWorker.on('failed', (job, err) => {
  logger.error(`Export job ${job?.id} failed: ${err.message}`);
});

export default exportQueue;

