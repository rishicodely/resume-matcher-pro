/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsUrl } from 'class-validator';

export class CreateMatchDto {
  @IsUrl()
  resumeUrl!: string;

  @IsString()
  jd!: string;

  @IsString()
  userId!: string;
}
