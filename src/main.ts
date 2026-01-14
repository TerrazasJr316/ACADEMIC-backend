import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CONFIGURACIÓN DE CORS ---
  // Permite conexiones de desarrollo desde cualquier origen
  app.enableCors({
    origin: true, // Refleja el origen de la petición
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // ------------------------------

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Backend corriendo en: http://localhost:3000`);
}
bootstrap();