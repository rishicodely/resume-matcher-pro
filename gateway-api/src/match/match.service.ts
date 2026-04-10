/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Pool, QueryResult } from 'pg';

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
    this.pool = new Pool({
      user: 'myuser',
      host: 'localhost',
      database: 'mydatabase',
      password: 'mypassword',
      port: 5432,
    });
  }

  async processResume(resumeData: any) {
    const jobId = `job_${Date.now()}`;

    await this.resumeQueue.add('analyze-resume', {
      jobId,
      ...resumeData,
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
