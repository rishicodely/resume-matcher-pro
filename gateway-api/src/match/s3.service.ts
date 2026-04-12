/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as dotenv from 'dotenv';
dotenv.config();

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export const getUploadUrl = async (
  filename: string,
  type: string,
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: filename,
    ContentType: type,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 600 });

  return url;
};
