import 'dotenv/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { processRun } from '@amable/jobs';

const connection = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'runs',
  async (job) => {
    const runId = job.data.runId as string;
    await processRun(runId);
  },
  { connection }
);

worker.on('failed', (job, err) => {
  console.error('Job failed', job?.id, err);
});

console.log('Worker runs listening…');
