import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Configuración agresiva de CORS
  app.enableCors({
    origin: '*', // Permite peticiones desde cualquier lugar (incluyendo tu puerto 5173 de Vite)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Servidor corriendo: http://localhost:3000`);
}

void bootstrap().catch((err) => {
  console.error('Error al iniciar:', err);
});
