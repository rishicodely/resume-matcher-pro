import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MatchService {
  constructor(@InjectQueue('resume-queue') private resumeQueue: Queue) {}

  async processResume(resumeData: any) {
    const jobId = `job_${Date.now()}`;
    
    await this.resumeQueue.add('analyze-resume', {
      jobId,
      ...resumeData
    }, {
      attempts: 3, 
      backoff: 5000, 
    });

    return { jobId, status: 'QUEUED' };
  }
}