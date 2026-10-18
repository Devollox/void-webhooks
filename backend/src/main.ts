import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { fastifyRawBody } from 'fastify-raw-body';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(fastifyRawBody, {
    field: 'rawBody',
    global: true,
    encoding: 'utf8',
    runFirst: true,
  });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://voidpresence.com',
      'https://api.voidpresence.com',
      'https://status.voidpresence.com',
      'https://www.voidpresence.com',
    ],
    methods: [
      'GET',
      'HEAD',
      'QUERY',
      'PUT',
      'PATCH',
      'POST',
      'DELETE',
      'OPTIONS',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8080, '0.0.0.0');
}

void bootstrap();
