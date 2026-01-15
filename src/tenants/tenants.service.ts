import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm'; // Importante para guardar todo junto
import { RegisterTenantDto } from './dtos/register-tenant.dto';
import { School } from './entities/school.entity';
import { BillingInfo } from './entities/billing-info.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../shared/enums/user-role.enum';
import * as bcrypt from 'bcrypt'; // Para encriptar contraseña

@Injectable()
export class TenantsService {
  // Inyectamos el DataSource para manejar transacciones
  constructor(private readonly dataSource: DataSource) {}

  async registerSchool(data: RegisterTenantDto) {
    // Iniciamos una transacción (Si algo falla, no se guarda NADA)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. CREAR LA ESCUELA 🏫
      const newSchool = new School();
      newSchool.nombreEscuela = data.nombreEscuela;
      newSchool.dominioEscuela = data.dominioEscuela;
      newSchool.correoContacto = data.emailAdmin;
      newSchool.planSuscripcion = data.plan;
      
      // Guardamos la escuela usando el queryRunner
      const savedSchool = await queryRunner.manager.save(newSchool);

      // 2. CREAR INFO DE FACTURACIÓN 💳
      const newBilling = new BillingInfo();
      newBilling.nombreTitular = data.nombreTitular;
      newBilling.ultimosDigitosTarjeta = data.tarjetaUltimos4;
      newBilling.tokenPago = data.tokenPago;
      newBilling.fechaVencimiento = new Date(); // Simulamos fecha actual
      newBilling.direccionFiscal = 'Dirección pendiente'; 
      newBilling.school = savedSchool; // <--- AQUÍ LA CONECTAMOS

      await queryRunner.manager.save(newBilling);

      // 3. CREAR EL USUARIO ADMIN 👤
      const newUser = new User();
      newUser.fullName = data.nombreAdmin;
      newUser.email = data.emailAdmin;
      newUser.rol = UserRole.ADMIN; // Es el jefe
      newUser.school = savedSchool; // <--- LO CONECTAMOS A LA ESCUELA
      
      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(data.passwordAdmin, salt);

      await queryRunner.manager.save(newUser);

      // SI TODO SALIÓ BIEN, CONFIRMAMOS LOS CAMBIOS ✅
      await queryRunner.commitTransaction();

      return {
        message: '¡Escuela registrada con éxito!',
        schoolId: savedSchool.id,
        adminEmail: newUser.email
      };

    } catch (error) {
      // SI ALGO FALLÓ, DESHACEMOS TODO ❌
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error al registrar: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }
}