import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Helpinaut API')
    .setDescription(
      'REST API Documentation for Helpinaut. Built with NestJS, Prisma and PostgreSQL.',
    )
    .setVersion('0.1')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('swagger', app, swaggerDocument, {
    customSiteTitle: 'Helpinaut API | Swagger',
  });

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  await app.listen(port, () => {
    console.log(`Helpinaut API running in port ${port}`);
    console.log(`Try me in http://localhost:${port}/swagger`);
  });
}

bootstrap();
