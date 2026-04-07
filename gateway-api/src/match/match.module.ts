import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'resume-queue',
    }),
  ],
  controllers: [MatchController],
  providers: [MatchService, MatchGateway],
  exports: [MatchGateway],
})
export class MatchModule {}
