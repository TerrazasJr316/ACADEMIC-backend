import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './entities/student-profile.entity';

@Injectable()
export class StudentService {
    constructor(
        @InjectRepository(StudentProfile)
        private readonly studentRepository: Repository<StudentProfile>,
    ) { }

    async getStudentProfile(userId: string) {
        const profile = await this.studentRepository.findOne({
            where: { user: { id: userId } },
            relations: ['user'], // Para traer nombre/email desde la tabla User
        });

        if (!profile) {
            throw new NotFoundException('Perfil de alumno no encontrado');
        }

        // Mapeamos los datos para que el Front (alumno.service.ts) los reciba como espera
        return {
            id: profile.id,
            nombre: profile.user.fullName, // Campo de la entidad User
            email: profile.user.email, // Campo de la entidad User
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

    async getDashboardSummary(userId: string) {
        const profile = await this.getStudentProfile(userId);

        // Aquí podrías integrar con los otros servicios (Finance/Academic)
        // Por ahora, devolvemos la estructura que tu front espera en el summary
        return {
            perfil: profile,
            notificaciones: [
                { id: '1', mensaje: 'Bienvenido al ciclo 2025-1', leida: false, fecha: new Date() }
            ],
            estadisticas: {
                asistencia: 95,
                promedioGeneral: 9.0
            }
        };
    }
}