import { Controller, Post, Body } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  async uploadResume(@Body() body: { resumeUrl: string; jd: string }) {
    return await this.matchService.processResume(body);
  }
}