import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchModule } from './match/match.module';

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
})
export class AppModule {}