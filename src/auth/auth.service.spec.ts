
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: JwtService;
    let userRepositoryMock: any;

    // 1. MOCKS (Simuladores)
    const mockUserRepository = {
        findOne: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(() => 'token_de_prueba_falso_123'),
        verify: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                // Proveemos el repositorio de User, que es lo que AuthService pide en su constructor
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
        userRepositoryMock = module.get(getRepositoryToken(User));
    });

    describe('validateUser', () => {
        it('Debe retornar el usuario sin password si las credenciales son válidas', async () => {
            const userMock = {
                id: 'user-123',
                email: 'test@school.com',
                password: 'hashed_password', // En BD está hasheado
                rol: 'ALUMNO',
                fullName: 'Test User',
                school: { id: 'school-123' }
            };

            // Simulamos que el repositorio encuentra al usuario
            mockUserRepository.findOne.mockResolvedValue(userMock);

            // Simulamos que bcrypt dice "OK"
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            const result = await service.validateUser('test@school.com', 'password123');

            expect(result).toBeDefined();
            expect(result.email).toBe('test@school.com');
            // Verificamos que quite el password del resultado
            expect(result).not.toHaveProperty('password');
        });

        it('Debe retornar null si la contraseña no coincide', async () => {
            const userMock = {
                id: 'user-123',
                email: 'test@school.com',
                password: 'hashed_password',
            };

            mockUserRepository.findOne.mockResolvedValue(userMock);
            // Simulamos que bcrypt dice "Falso"
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            const result = await service.validateUser('test@school.com', 'wrong_password');

            expect(result).toBeNull();
        });

        it('Debe retornar null si el usuario no existe', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            const result = await service.validateUser('ghost@school.com', 'cualquiera');

            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('Debe generar un access_token para un objeto de usuario válido', async () => {
            // En tu implementación, 'login' recibe el objeto de usuario ya validado, no (email, pass)
            const userPayload = {
                id: 'user-123',
                email: 'test@school.com',
                rol: 'ALUMNO',
                fullName: 'Test User',
                school: { id: 'school-123' }
            };

            const result = await service.login(userPayload);

            expect(result).toHaveProperty('access_token');
            expect(result.access_token).toBe('token_de_prueba_falso_123');
            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe('test@school.com');
        });
    });
});