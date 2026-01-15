import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // 1. Permitimos usar la tabla Usuarios en este módulo
    TypeOrmModule.forFeature([User]),
    // 2. Activamos Passport
    PassportModule,

    // 3. Configuramos la máquina de Tokens (JWT)
    JwtModule.register({
      secret: 'MI_SECRETO_SUPER_SECRETO', // EN PRODUCCIÓN ESTO VA EN .ENV
      signOptions: { expiresIn: '1d' }, // El token dura 1 día
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], 
  exports: [JwtStrategy, PassportModule]
})
export class AuthModule {}