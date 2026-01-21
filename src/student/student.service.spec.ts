// src/student/student.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
// Entidades y Servicios necesarios
import { StudentProfile } from './entities/student-profile.entity';
import { CommunicationsService } from '../communications/communications.service';
import { AcademicService } from '../academic/service/academic.service';

describe('StudentService', () => {
    let service: StudentService;
    let studentRepoMock: any;
    let communicationsServiceMock: any;
    let academicServiceMock: any;

    beforeEach(async () => {
        // 1. MOCKS DE DEPENDENCIAS EXTERNAS
        // Simulamos el repositorio de base de datos
        studentRepoMock = {
            findOne: jest.fn(),
        };

        // Simulamos el servicio de Comunicaciones
        communicationsServiceMock = {
            getStudentNotifications: jest.fn(() => []),
        };

        // Simulamos el servicio Académico
        academicServiceMock = {
            getStudentAttendance: jest.fn(() => ({ estadisticas: { asistencia: 100 } })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StudentService,
                { provide: getRepositoryToken(StudentProfile), useValue: studentRepoMock },
                { provide: CommunicationsService, useValue: communicationsServiceMock },
                { provide: AcademicService, useValue: academicServiceMock },
            ],
        }).compile();

        service = module.get<StudentService>(StudentService);
    });

    // --- PRUEBA 1: Obtener Perfil (Éxito) ---
    it('getStudentProfile debe retornar los datos personales si el alumno existe', async () => {
        // A) PREPARACIÓN
        const perfilSimulado = {
            id: 'student-1',
            matricula: 'A001',
            user: { fullName: 'Juan Perez', email: 'juan@test.com' },
            gradoActual: '6',
        };
        studentRepoMock.findOne.mockResolvedValue(perfilSimulado);

        // B) EJECUCIÓN
        const resultado = await service.getStudentProfile('user-id-1');

        // C) VERIFICACIÓN
        expect(resultado).toBeDefined();
        expect(resultado.nombre).toBe('Juan Perez'); // Mapeo correcto
        expect(resultado.matricula).toBe('A001');
    });

    // --- PRUEBA 2: Error si no existe ---
    it('getStudentProfile debe lanzar NotFoundException si no encuentra al alumno', async () => {
        studentRepoMock.findOne.mockResolvedValue(null);

        await expect(service.getStudentProfile('user-fantasma'))
            .rejects.toThrow(NotFoundException);
    });

    // --- PRUEBA 3: Dashboard Summary (Integración de servicios) ---
    it('getDashboardSummary debe combinar datos de asistencia, notificaciones y perfil', async () => {
        // A) PREPARACIÓN (Mockeamos toda la cadena)

        // 1. Perfil
        studentRepoMock.findOne.mockResolvedValue({
            id: 'student-1',
            user: { fullName: 'Juan', email: 'j@t.com' }
        });

        // 2. Notificaciones (Simulamos 5 mensajes)
        communicationsServiceMock.getStudentNotifications.mockResolvedValue([
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
        ]);

        // 3. Asistencia
        academicServiceMock.getStudentAttendance.mockResolvedValue({
            estadisticas: { asistencia: 95 }
        });

        // B) EJECUCIÓN
        const dashboard = await service.getDashboardSummary('user-id-1');

        // C) VERIFICACIÓN
        // Verificamos que corta las notificaciones a solo 3 (según tu código slice(0,3))
        expect(dashboard.notificaciones).toHaveLength(3);

        // Verificamos que trae el porcentaje de asistencia del otro servicio
        expect(dashboard.asistenciaPorcentaje).toBe(95);

        // Verificamos el promedio (que en tu código actual es fijo 8.5)
        expect(dashboard.promedioGeneral).toBe(8.5);
    });
});