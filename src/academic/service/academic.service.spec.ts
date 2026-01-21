// src/academic/service/academic.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AcademicService } from './academic.service';
import { getRepositoryToken } from '@nestjs/typeorm';
// Entidades necesarias para los Mocks
import { TeacherProfile } from '../../teacher/entities/teacher-profile.entity';
import { Course } from '../entities/course.entity';
import { GradeCard } from '../entities/grade-card.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Group } from '../entities/group.entity';
import { AttendanceDetail } from '../entities/attendance-detail.entity';
import { InternalMessage } from '../../communications/entities/internal-message.entity';
import { User } from '../../users/entities/user.entity';
import { StudentProfile } from '../../student/entities/student-profile.entity';

describe('AcademicService', () => {
    let service: AcademicService;
    let gradeRepoMock: any;
    let attendanceRepoMock: any;

    // 1. FACTORÍA DE MOCKS (Para no repetir código 8 veces)
    const mockFactory = () => ({
        find: jest.fn(() => []),
        findOne: jest.fn(() => null),
        create: jest.fn((dto) => dto),
        save: jest.fn((dto) => Promise.resolve({ id: 'uuid', ...dto })),
        update: jest.fn(() => Promise.resolve({ affected: 1 })),
        // Truco: getStudentProfile usa "manager.getRepository", así que lo simulamos aquí
        manager: {
            getRepository: jest.fn().mockReturnThis(),
            findOne: jest.fn()
        }
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AcademicService,
                // Inyectamos los 8 repositorios falsos
                { provide: getRepositoryToken(TeacherProfile), useFactory: mockFactory },
                { provide: getRepositoryToken(Course), useFactory: mockFactory },
                { provide: getRepositoryToken(GradeCard), useFactory: mockFactory },
                { provide: getRepositoryToken(Enrollment), useFactory: mockFactory },
                { provide: getRepositoryToken(Group), useFactory: mockFactory },
                { provide: getRepositoryToken(AttendanceDetail), useFactory: mockFactory },
                { provide: getRepositoryToken(InternalMessage), useFactory: mockFactory },
                { provide: getRepositoryToken(User), useFactory: mockFactory },
            ],
        }).compile();

        service = module.get<AcademicService>(AcademicService);
        gradeRepoMock = module.get(getRepositoryToken(GradeCard));
        attendanceRepoMock = module.get(getRepositoryToken(AttendanceDetail));
    });

    // --- PRUEBA 1: Lógica Matemática (Promedios) ---
    it('Debe calcular el Promedio General correctamente (Matemáticas)', async () => {
        // A) PREPARACIÓN
        // Simulamos que el alumno tiene 3 materias con calificaciones: 80, 90 y 100.
        const boletasSimuladas = [
            { promedioFinal: 80 },
            { promedioFinal: 90 },
            { promedioFinal: 100 },
        ];

        // Le decimos al mock: "Cuando pidan calificaciones, entrega esto"
        gradeRepoMock.find.mockResolvedValue(boletasSimuladas);

        // B) EJECUCIÓN
        const resumen = await service.getStudentDashboardSummary('user-id-123');

        // C) VERIFICACIÓN
        // (80 + 90 + 100) / 3 = 90.0
        expect(resumen.promedioGeneral).toBe(90.0);
    });

    // --- PRUEBA 2: Lógica de Aislamiento (Seguridad de Datos) ---
    it('Debe solicitar SOLO la asistencia del usuario logueado', async () => {
        // A) PREPARACIÓN
        const userId = 'user-id-pepe';
        attendanceRepoMock.find.mockResolvedValue([]); // No importa qué devuelva, importa CÓMO se llama

        // B) EJECUCIÓN
        await service.getStudentAttendance(userId);

        // C) VERIFICACIÓN (Spy)
        // Verificamos que al buscar en la BD, se haya aplicado el filtro WHERE correcto.
        // Esto asegura que Pepe no vea las faltas de Juan.
        expect(attendanceRepoMock.find).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    enrollment: {
                        student: { user: { id: userId } } // 🔥 Aquí está la clave
                    }
                }
            })
        );
    });
});