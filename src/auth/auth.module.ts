import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    // 1. Permitimos usar la tabla Usuarios en este módulo
    TypeOrmModule.forFeature([User]),
    // 2. Activamos Passport
    PassportModule,

    // 3. Configuramos la máquina de Tokens (JWT)
    JwtModule.register({
      // ¡AQUI ESTABA EL ERROR! Ahora usa la misma clave que la Estrategia
      secret: process.env.JWT_SECRET || '428ec0f41dd5af3c71a1964bcfb59723', 
      signOptions: { expiresIn: '1d' }, // El token dura 1 día
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [JwtStrategy, PassportModule]
})
export class AuthModule {}