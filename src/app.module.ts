import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './users/users.module'; // <--- AGREGAR
import { FinanceModule } from './finance/finance.module'; // <--- AGREGAR
import { AcademicModule } from './academic/academic.module'; // <--- AGREGAR
import { CommunicationsModule } from './communications/communications.module';

@Module({
  imports: [
    // 1. Cargar variables de entorno (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configuración de Base de Datos (AQUÍ ESTÁ LA MAGIA)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'academic_saas',
      autoLoadEntities: true, // <--- Carga tus entidades automáticamente
      synchronize: true, // <--- ¡ESTO CREA LAS TABLAS POR TI! (Solo dev)
      dropSchema: false,
    }),

    // Tus módulos funcionales
    CoreModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    AdminModule,
    TeacherModule,
    StudentModule,
    SharedModule,
    AcademicModule,
    FinanceModule,
    CommunicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
