import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  async uploadResume(
    @Body() body: { resumeUrl: string; jd: string; userId: string },
  ) {
    return await this.matchService.processResume(body);
  }

  @Get('history/:userId')
  async getHistory(@Param('userId') userId: string) {
    return await this.matchService.getUserHistory(userId);
  }
}
