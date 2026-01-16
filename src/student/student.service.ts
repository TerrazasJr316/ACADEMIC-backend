import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './entities/student-profile.entity';
import { CommunicationsService } from '../communications/communications.service'; // Importamos el servicio de notificaciones

@Injectable()
export class StudentService {
    constructor(
        @InjectRepository(StudentProfile)
        private readonly studentRepository: Repository<StudentProfile>,
        private readonly communicationsService: CommunicationsService, // Inyectamos notificaciones
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
            tipoSangre: profile.tipoSangre,
        };
    }

    /**
     * Mapeado para getAlumnoDashboardSummary en alumno.service.ts
     */
    async getDashboardSummary(userId: string) {
        const profile = await this.getStudentProfile(userId);

        // Obtenemos las notificaciones reales del módulo de comunicaciones
        const notificacionesReales = await this.communicationsService.getStudentNotifications(userId);

        return {
            promedioGeneral: 8.5, // Este dato vendrá de Academic más adelante
            asistenciaPorcentaje: 90, // Este dato vendrá de Academic más adelante
            notificaciones: notificacionesReales.slice(0, 3), // Solo enviamos las 3 más recientes para el Dashboard
        };
    }
}