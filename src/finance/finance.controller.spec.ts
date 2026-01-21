// src/finance/finance.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { UserRole } from '../shared/enums/user-role.enum';
import { Reflector } from '@nestjs/core'; // Herramienta para leer "candados" (metadata)

describe('FinanceController Security', () => {
    let controller: FinanceController;
    let reflector: Reflector;

    // 1. EL MOCK (El impostor)
    // Como es una prueba unitaria, NO queremos conectar la Base de Datos real.
    // Creamos un "FinanceService falso" que no hace nada, solo simula funcionar.
    const mockFinanceService = {
        createConcept: jest.fn(() => Promise.resolve({ id: 'mock-id', nombre: 'Cobro Test' })),
        findAll: jest.fn(() => Promise.resolve([])),
    };

    // 2. CONFIGURACIÓN ANTES DE CADA PRUEBA
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FinanceController],
            providers: [
                {
                    provide: FinanceService,
                    useValue: mockFinanceService, // Usamos el falso
                },
            ],
        }).compile();

        controller = module.get<FinanceController>(FinanceController);
        reflector = module.get<Reflector>(Reflector);
    });

    // 3. LA PRUEBA REAL (El Test Case)
    it('Debe tener el candado de seguridad ADMIN en createConcept', () => {
        // A) Buscamos la función que queremos probar
        const funcionAProbar = controller.createConcept;

        // B) Leemos el "candado" (metadata) que tiene puesto encima (@Roles)
        // NestJS guarda los roles en una etiqueta llamada 'roles'
        const rolesRequeridos = reflector.get<UserRole[]>('roles', funcionAProbar);

        // C) LAS EXPECTATIVAS (Lo que Jest valida)

        // Validamos que el candado exista
        expect(rolesRequeridos).toBeDefined();

        // Validamos que el candado contenga el rol de ADMIN
        expect(rolesRequeridos).toContain(UserRole.ADMIN);

        // (Opcional) Validamos que NO deje pasar a un ALUMNO
        expect(rolesRequeridos).not.toContain(UserRole.ALUMNO);
    });
});