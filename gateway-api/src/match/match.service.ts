/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Pool, QueryResult } from 'pg';

import { CreateMatchDto } from './create-match.dto';
import { randomUUID } from 'crypto';

import * as dotenv from 'dotenv';
dotenv.config();

type MatchHistory = {
  job_id: string;
  score: number;
  created_at: Date;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } | null;
};

type MatchHistoryRow = {
  job_id: string;
  score: number;
  created_at: Date;
  feedback: string | null; // 👈 DB reality
};

@Injectable()
export class MatchService {
  private readonly pool: Pool;

  constructor(
    @InjectQueue('resume-queue') private readonly resumeQueue: Queue,
  ) {
    if (!process.env.DB_USER) {
      throw new Error('DB config missing');
    }
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async processResume(resumeData: CreateMatchDto) {
    const jobId = `job_${randomUUID()}`;
    console.log('📦 Queuing job:', jobId, resumeData.resumeUrl);

    await this.resumeQueue.add(
      'analyze-resume',
      {
        jobId,
        resumeUrl: resumeData.resumeUrl,
        jd: resumeData.jd,
        userId: resumeData.userId,
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return { jobId, status: 'QUEUED' };
  }

  async getUserHistory(userId: string): Promise<MatchHistory[]> {
    const query = `
      SELECT job_id, score, created_at, feedback
      FROM match_results
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const result: QueryResult<MatchHistoryRow> = await this.pool.query(query, [
      userId,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result.rows.map((row) => {
      let parsedFeedback = null;

      if (row.feedback) {
        try {
          // clean markdown if present
          const cleaned = row.feedback
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

          // extract JSON safely
          const start = cleaned.indexOf('{');
          const end = cleaned.lastIndexOf('}');

          const jsonString =
            start !== -1 && end !== -1
              ? cleaned.substring(start, end + 1)
              : cleaned;

          parsedFeedback = JSON.parse(jsonString);
        } catch (e: any) {
          console.log('❌ Feedback parse error:', e.message);
          parsedFeedback = null; // fallback
        }
      }

      return {
        ...row,
        feedback: parsedFeedback,
      };
    });
  }
}
