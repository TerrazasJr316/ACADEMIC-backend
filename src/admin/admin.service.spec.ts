// src/admin/admin.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
// Importamos las entidades necesarias (asegúrate que las rutas sean correctas en tu proyecto)
import { User } from '../users/entities/user.entity';
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { TeacherProfile } from '../teacher/entities/teacher-profile.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { School } from '../tenants/entities/school.entity';
import { InternalMessage } from '../communications/entities/internal-message.entity';
import { Subject } from '../academic/entities/subject.entity';
import { UserRole } from '../shared/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

// 1. SOLUCIÓN AL ERROR DE BCRYPT (Igual que en Auth)
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('AdminService', () => {
    let service: AdminService;

    // 2. MOCKS GENÉRICOS DE REPOSITORIOS
    // Usaremos este mock para todos los repositorios simples
    const mockRepo = {
        find: jest.fn(() => []),
        findOne: jest.fn(() => null),
        create: jest.fn((dto) => dto),
        save: jest.fn((dto) => Promise.resolve({ id: 'uuid-123', ...dto })),
        delete: jest.fn(() => Promise.resolve({ affected: 1 })),
    };

    // Mock específico para School (para que devuelva una escuela al crear user)
    const mockSchoolRepo = {
        ...mockRepo,
        findOne: jest.fn(() => Promise.resolve({ id: 'school-1', nombre: 'Escuela Test' })),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                // Inyectamos Mocks para CADA repositorio que usa tu constructor
                { provide: getRepositoryToken(User), useValue: mockRepo },
                { provide: getRepositoryToken(Group), useValue: mockRepo },
                { provide: getRepositoryToken(Enrollment), useValue: mockRepo },
                { provide: getRepositoryToken(StudentProfile), useValue: mockRepo },
                { provide: getRepositoryToken(TeacherProfile), useValue: mockRepo },
                { provide: getRepositoryToken(AcademicPeriod), useValue: mockRepo },
                { provide: getRepositoryToken(School), useValue: mockSchoolRepo }, // Usamos el mock especial
                { provide: getRepositoryToken(InternalMessage), useValue: mockRepo },
                { provide: getRepositoryToken(Subject), useValue: mockRepo },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
    });

    // --- PRUEBA 1: Crear Docente (User + Profile) ---
    it('createTeacher debe crear un Usuario y un Perfil Docente encriptando la clave', async () => {
        // A) DATOS DE ENTRADA
        const dtoDocente = {
            nombre: 'Profesor X',
            email: 'profe@test.com',
            clave: '123456',
            especialidad: 'Ciencias',
            telefono: '555-555'
        };
        const schoolId = 'school-1';

        // B) CONFIGURAR COMPORTAMIENTO (Bcrypt)
        (bcrypt.hash as jest.Mock).mockResolvedValue('password_encriptada_xyz');

        // C) EJECUCIÓN
        const resultado = await service.createTeacher(dtoDocente, schoolId);

        // D) VERIFICACIONES (ASSERTS)
        // 1. Verificamos que devolvió éxito
        expect(resultado).toHaveProperty('message', 'Docente registrado');

        // 2. Verificamos que se llamó a guardar USUARIO con el rol correcto
        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            email: 'profe@test.com',
            rol: UserRole.DOCENTE, // 🔥 Vital: Que no cree un admin por error
            password: 'password_encriptada_xyz' // 🔥 Vital: Que no guarde texto plano
        }));

        // 3. Verificamos que se guardó el PERFIL
        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            especialidad: 'Ciencias'
        }));
    });

    // --- PRUEBA 2: Validar encriptación ---
    it('Debe fallar si bcrypt falla (Simulacro de error)', async () => {
        (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Error de encriptación'));

        await expect(service.createTeacher({} as any, 'school-1'))
            .rejects.toThrow('Error de encriptación');
    });
});