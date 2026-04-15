import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchModule } from './match/match.module';
import { RedisSubscriber } from './redis.subscriber';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();
@Module({
  imports: [
    BullModule.forRoot({
      connection: new Redis(process.env.REDIS_URL!, {
        tls: {},
      }),
    }),
    MatchModule,
  ],
  providers: [RedisSubscriber],
})
export class AppModule {}
