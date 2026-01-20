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
    TypeOrmModule.forFeature([User]),
    // ✅ 1. Activar Passport con estrategia 'jwt' por defecto
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // ✅ 2. Configurar el Módulo JWT con la CLAVE MAESTRA FIJA
    JwtModule.register({
      secret: 'CLAVE_SECRETA_MAESTRA_12345', // <--- SIN process.env PARA EVITAR ERRORES
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  // ✅ 3. VITAL: Exportar esto para que AdminModule pueda usar el guardián
  exports: [JwtStrategy, PassportModule, AuthService]
})
export class AuthModule {}