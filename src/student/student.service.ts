import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './entities/student-profile.entity';
import { CommunicationsService } from '../communications/communications.service';
import { AcademicService } from '../academic/service/academic.service'; // 👈 1. IMPORTAR

@Injectable()
export class StudentService {
    constructor(
        @InjectRepository(StudentProfile)
        private readonly studentRepository: Repository<StudentProfile>,
        private readonly communicationsService: CommunicationsService,
        private readonly academicService: AcademicService, // 👈 2. INYECTAR AQUÍ
    ) { }

    async getStudentProfile(userId: string) {
        const profile = await this.studentRepository.findOne({
            where: { user: { id: userId } },
            relations: ['user'],
        });

        if (!profile) {
            throw new NotFoundException('Perfil de alumno no encontrado');
        }

        return {
            id: profile.id,
            nombre: profile.user.fullName,
            email: profile.user.email,
            matricula: profile.matricula,
            gradoActual: profile.gradoActual,
            curp: profile.curp,
            telefono: profile.telefono,
            direccion: profile.direccion,
            genero: profile.genero,
            fechaNacimiento: profile.fechaNacimiento,
        };
    }

    async getDashboardSummary(userId: string) {
        // 1. Obtenemos perfil
        const profile = await this.getStudentProfile(userId);

        // 2. Obtenemos notificaciones (Communications)
        const notificacionesReales = await this.communicationsService.getStudentNotifications(userId);

        // 3. Obtenemos asistencia REAL (Academic) - 🔥 CAMBIO CLAVE
        const asistenciaData = await this.academicService.getStudentAttendance(userId);

        return {
            promedioGeneral: 8.5, // 🚧 Este sigue pendiente de calcular si gustas
            asistenciaPorcentaje: asistenciaData.estadisticas.asistencia, // ✅ DATO REAL SINCROIZADO
            notificaciones: notificacionesReales.slice(0, 3),
        };
    }
}