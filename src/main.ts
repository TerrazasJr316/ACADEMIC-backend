import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // 1. Crear la aplicación
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // 2. Pipes globales
  app.useGlobalPipes(new ValidationPipe());

  // 3. Habilitar CORS (CRÍTICO para que el frontend no se bloquee)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

<<<<<<< HEAD
=======
  // 4. Configurar Swagger
>>>>>>> 8c69efff30489cc7dc90da693eaa076b813ae660
  const config = new DocumentBuilder()
    .setTitle('API Sistema Escolar SaaS')
    .setDescription('Documentación de la API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

<<<<<<< HEAD
=======
  // 5. Iniciar el servidor
>>>>>>> 8c69efff30489cc7dc90da693eaa076b813ae660
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 Servidor corriendo en: http://localhost:3000`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();