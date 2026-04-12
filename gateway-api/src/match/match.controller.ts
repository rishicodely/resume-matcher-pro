/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto } from './create-match.dto';
import { getUploadUrl } from './s3.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  async createMatch(@Body() body: CreateMatchDto) {
    return this.matchService.processResume(body);
  }

  @Post('upload-url')
  async getUploadUrl(
    @Body() body: { filename: string; type: string },
  ): Promise<{ url: string; fileUrl: string }> {
    const url = await getUploadUrl(body.filename, body.type);

    return {
      url,
      fileUrl: `https://resume-analyzer-pro.s3.us-east-1.amazonaws.com/${body.filename}`,
    };
  }

  @Get('history/:userId')
  async getHistory(@Param('userId') userId: string) {
    return await this.matchService.getUserHistory(userId);
  }
}
