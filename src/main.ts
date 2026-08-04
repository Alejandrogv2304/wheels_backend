import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   // Habilita CORS para permitir peticiones desde Angular
  app.enableCors({
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  });

  // Middleware para parsear cookies
  app.use(cookieParser());

   //Con esto ponemos un prefijo global a todas las rutas de la API
  app.setGlobalPrefix('api/v1');

  // Habilita validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían propiedades extras
      transform: true, // Convierte payloads a instancias de DTOs
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
