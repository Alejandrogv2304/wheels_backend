import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || 3000;

  // Habilita CORS para permitir peticiones desde Angular
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  });

  // Middleware para parsear cookies
  app.use(cookieParser());

  // Aquí usamos el filtro de excepciones HTTP que tenemos en common
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Wheels API')
    .setDescription('API para Wheels App')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Con esto ponemos un prefijo global a todas las rutas de la API
  app.setGlobalPrefix('api/v1');

  // Habilita validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían propiedades extras
      transform: true, // Convierte payloads a instancias de DTOs
    }),
  );

  await app.listen(port);

  console.log(`Aplicación corriendo en http://localhost:${port}/api/v1`);
  console.log(`Documentación de la API disponible en http://localhost:${port}/api/docs`);
}
bootstrap();
