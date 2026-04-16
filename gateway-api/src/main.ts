import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('🚀 CORS ENABLED');
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: [
      'https://resume-matcher-1wtsrc9a2-rishicodelys-projects.vercel.app',
      'http://localhost:5173', // for local dev
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
