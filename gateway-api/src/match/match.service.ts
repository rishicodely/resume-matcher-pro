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
    });
  }

  async processResume(resumeData: CreateMatchDto) {
    const jobId = `job_${randomUUID()}`;
    console.log('📦 Queuing job:', jobId, resumeData.resumeUrl);

    await this.resumeQueue.add('analyze-resume', {
      jobId,
      resumeUrl: resumeData.resumeUrl,
      jd: resumeData.jd,
      userId: resumeData.userId,
    });

    return { jobId, status: 'QUEUED' };
  }

  async getUserHistory(userId: string): Promise<MatchHistory[]> {
    const query = `
      SELECT job_id, score, created_at
      FROM match_results
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const result: QueryResult<MatchHistory> = await this.pool.query(query, [
      userId,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result.rows;
  }
}
