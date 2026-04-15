import { Worker, Job, Queue } from "bullmq";
import Redis, * as IORedis from "ioredis";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const dlq = new Queue("resume-dlq", { connection });

interface MatchJobData {
  jobId: string;
  resumeUrl: string;
  jd: string;
  userId: string;
}

const worker = new Worker(
  "resume-queue",
  async (job: Job<MatchJobData>) => {
    const { jobId, resumeUrl, jd, userId } = job.data;

    console.log("🔍 Processing job:", jobId);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await axios.post<void>(`${process.env.JAVA_API_URL}/process`, {
        jobId,
        resumeUrl,
        jd,
        userId,
      });

      console.log("✅ Job processed:", jobId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("❌ Error:", err.message);
      }
      throw err;
    }
  },
  { connection, concurrency: 1 },
);

worker.on("failed", (job, err) => {
  void (async () => {
    if (!job) return;

    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await dlq.add("failed-job", {
        originalJobId: job.id,
        data: job.data,
        error: err.message,
        failedAt: new Date(),
      });

      console.log(`📦 Moved to DLQ: ${job.id}`);
    }
  })();
});
