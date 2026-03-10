import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './utils/prisma-client-exception.filter';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const port = process.env.PORT ?? 3000;

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Helpinaut API')
    .setDescription(
      'REST API Documentation for Helpinaut. Built with NestJS, Prisma and PostgreSQL.',
    )
    .setVersion('0.1')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
      name: 'Authorization',
      description: 'Enter your Bearer token',
    })
    .addSecurityRequirements('bearer')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'Helpinaut API | Swagger',
  });

  //Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaClientExceptionFilter());

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableShutdownHooks();

  await app.listen(port, () => {
    console.log(`Helpinaut API running in port ${port}`);
    console.log(`Try me in http://localhost:${port}/api/docs`);
  });
}

bootstrap();
