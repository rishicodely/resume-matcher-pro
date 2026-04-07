import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { MatchGateway } from './match/match.gateway';

type ResumeEvent = {
  jobId: string;
  userId: string;
  status: string;
};

@Injectable()
export class RedisSubscriber implements OnModuleInit {
  private subscriber = new Redis();
  constructor(private readonly matchGateway: MatchGateway) {}

  async onModuleInit() {
    await this.subscriber.subscribe('resume_status_updates');

    this.subscriber.on('message', (channel, message) => {
      console.log('🔥 Received from Java:', message);

      try {
        const parsed = JSON.parse(message) as unknown;
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'jobId' in parsed &&
          'userId' in parsed &&
          'status' in parsed
        ) {
          const data = parsed as ResumeEvent;
          this.matchGateway.notifyCompletion(data);
          console.log(`✅ Job ${data.jobId} completed for user ${data.userId}`);
        } else {
          console.warn('⚠️ Invalid message format:', parsed);
        }
      } catch (err) {
        console.error('❌ Failed to parse message:', err);
      }
    });
  }
}
