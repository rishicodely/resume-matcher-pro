import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchModule } from './match/match.module';
import { RedisSubscriber } from './redis.subscriber';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    MatchModule,
  ],
  providers: [RedisSubscriber],
})
export class AppModule {}
