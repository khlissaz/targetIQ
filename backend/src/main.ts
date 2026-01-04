import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  console.log(process.env.APP_URL);

  // valide les DTOs en utilisant les décorateurs class-validator et transforme automatiquement les données entrantes en instances du DTO.
  // Cela garantit que les données des requêtes (ex. : corps de POST /lead-enrichment-tasks) respectent les contraintes définies dans vos DTOs, sinon une erreur 400 sera renvoyée. 
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.use((req, res, next) => {
    const originalSend = res.send;

    // Hook into `res.send` to capture the response body
    res.send = function (body) {
      console.log(`[${req.method}] ${req.url} - Status: ${res.statusCode}`);

      if (res.statusCode >= 400) {
        console.log('Response Body:', body);
      }

      // Call the original `send` method
      return originalSend.apply(this, arguments);
    };

    next();
  });
  // Enable CORS
  app.enableCors({
    origin: ['https://www.linkedin.com', 'https://web.whatsapp.com',  process.env.APP_URL], // Update this to match your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,  });

  // Increase the payload size limit
  const port = process.env.PORT || 5000;
  await app.listen(port);
  Logger.log("Environment Variables:");
  Logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  // Logger.log(`IS_MODE_DEBUG_FOR_NESTJS: ${process.env.IS_MODE_DEBUG_FOR_NESTJS}`);
  Logger.log(`API_URL: ${process.env.API_URL}`);
  Logger.log(`APP_URL: ${process.env.APP_URL}`);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}
bootstrap();