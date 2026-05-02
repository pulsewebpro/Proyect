import { Queue } from 'bullmq';
import Redis from 'ioredis';

let connection: Redis | null = null;
let runQueue: Queue | null = null;

export function getRedis(): Redis {
  if (!connection) {
    const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    connection = new Redis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getRunQueue(): Queue {
  if (!runQueue) {
    runQueue = new Queue('runs', { connection: getRedis() });
  }
  return runQueue;
}
