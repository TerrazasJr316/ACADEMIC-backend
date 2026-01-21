// src/communications/communications.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationsService } from './communications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotFoundException } from '@nestjs/common';

describe('CommunicationsService', () => {
    let service: CommunicationsService;
    let repoMock: any;

    beforeEach(async () => {
        // 1. MOCK DEL REPOSITORIO
        repoMock = {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn((n) => Promise.resolve(n)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommunicationsService,
                {
                    provide: getRepositoryToken(Notification),
                    useValue: repoMock,
                },
            ],
        }).compile();

        service = module.get<CommunicationsService>(CommunicationsService);
    });

    // --- PRUEBA 1: Obtener Notificaciones ---
    it('getStudentNotifications debe devolver notificaciones formateadas', async () => {
        // A) PREPARACIÓN
        const fechaFija = new Date('2025-01-20T10:00:00Z');
        const mockNotificaciones = [
            { id: '1', mensaje: 'Hola', leida: false, fechaCreacion: fechaFija },
        ];

        repoMock.find.mockResolvedValue(mockNotificaciones);

        // B) EJECUCIÓN
        const resultado = await service.getStudentNotifications('user-123');

        // C) VERIFICACIÓN
        expect(repoMock.find).toHaveBeenCalledWith(
            expect.objectContaining({ where: { user: { id: 'user-123' } } })
        );
        expect(resultado[0].mensaje).toBe('Hola');
        // Verificamos que la fecha se haya convertido a String (formato local)
        expect(typeof resultado[0].fecha).toBe('string');
    });

    // --- PRUEBA 2: Marcar como Leída ---
    it('markAsRead debe cambiar el estado de la notificación a leída', async () => {
        // A) PREPARACIÓN
        // Simulamos una notificación que está "no leída" (false)
        const notifExistente = { id: 'notif-1', leida: false };
        repoMock.findOneBy.mockResolvedValue(notifExistente);

        // B) EJECUCIÓN
        await service.markAsRead('notif-1');

        // C) VERIFICACIÓN
        // Verificamos que al guardar, la propiedad 'leida' haya cambiado a true
        expect(notifExistente.leida).toBe(true);
        expect(repoMock.save).toHaveBeenCalledWith(notifExistente);
    });

    // --- PRUEBA 3: Error si no existe ---
    it('markAsRead debe lanzar error si la notificación no existe', async () => {
        repoMock.findOneBy.mockResolvedValue(null);

        await expect(service.markAsRead('id-falso'))
            .rejects.toThrow(NotFoundException);
    });
});