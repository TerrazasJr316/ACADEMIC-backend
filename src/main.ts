import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- ESTA ES LA PARTE CLAVE ---
  // Permite que tu React (puerto 5173) pueda hacerle preguntas a NestJS
  app.enableCors({
    origin: 'http://localhost:5173', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // ------------------------------

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Backend corriendo en: http://localhost:3000`);
}
bootstrap();