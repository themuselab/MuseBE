import { Queue, Worker, QueueEvents, Job as BullJob } from "bullmq";
import IORedis, { Redis } from "ioredis";

export const AD_GENERATION_QUEUE = "ad-generation";

export type AdGenerationJobData = {
  jobId: string;
};

let connection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (connection) return connection;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL env is required");
  connection = new IORedis(url, { maxRetriesPerRequest: null });
  return connection;
}

let queue: Queue<AdGenerationJobData> | null = null;

export function getAdGenerationQueue(): Queue<AdGenerationJobData> {
  if (queue) return queue;
  queue = new Queue<AdGenerationJobData>(AD_GENERATION_QUEUE, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 60 * 60 * 24 },
      removeOnFail: { age: 60 * 60 * 24 * 7 },
    },
  });
  return queue;
}

let queueEvents: QueueEvents | null = null;

export function getAdGenerationQueueEvents(): QueueEvents {
  if (queueEvents) return queueEvents;
  queueEvents = new QueueEvents(AD_GENERATION_QUEUE, {
    connection: getRedisConnection(),
  });
  return queueEvents;
}

export type AdGenerationProcessor = (
  job: BullJob<AdGenerationJobData>,
) => Promise<void>;

export function startAdGenerationWorker(
  processor: AdGenerationProcessor,
): Worker<AdGenerationJobData> {
  const worker = new Worker<AdGenerationJobData>(
    AD_GENERATION_QUEUE,
    processor,
    {
      connection: getRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[ad-worker] job ${job?.id} failed:`, err.message);
  });

  return worker;
}
