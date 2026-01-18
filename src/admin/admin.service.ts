import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { School } from '../tenants/entities/school.entity'; 

import { UserRole } from '../shared/enums/user-role.enum';
import { EnrollmentStatus } from '../shared/enums/enrollment-status.enum'; 
import { AddStudentDto } from './dtos/add-student-to-group.dto';
import { CreateGroupDto } from './dtos/create-group.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(StudentProfile) private readonly profileRepo: Repository<StudentProfile>,
    @InjectRepository(AcademicPeriod) private periodRepo: Repository<AcademicPeriod>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
  ) {}

  // 1. OBTENER GRUPOS CON CONTEO DE ALUMNOS
  async getGroups(schoolId: string) {
    const grupos = await this.groupRepo.find({
      where: { period: { school: { id: schoolId } } },
      relations: ['period']
    });

    const gruposConConteo = await Promise.all(grupos.map(async (grupo) => {
      const total = await this.enrollmentRepo.count({
        where: { group: { id: grupo.id } }
      });
      return {
        ...grupo,
        totalAlumnos: total
      };
    }));

    return gruposConConteo;
  }

  // 2. CREAR GRUPO
  async saveGroup(dto: CreateGroupDto, schoolId: string) {
    const p = await this.periodRepo.findOne({ 
        where: { school: { id: schoolId }, esActual: true } 
    });
    
    if (!p) {
        throw new BadRequestException('No se encontró un ciclo académico activo.');
    }
    
    const newGroup = this.groupRepo.create({
        nombre: dto.nombre,
        semestre: dto.semestre ? Number(dto.semestre) : 1, 
        period: p,
        limiteAlumnos: 40
    });

    return await this.groupRepo.save(newGroup);
  }

  // 3. ACTUALIZAR GRUPO
  async updateGroup(id: string, dto: any) {
    const grupo = await this.groupRepo.findOne({ where: { id } });
    if (!grupo) throw new NotFoundException('Grupo no encontrado');
    
    if (dto.nombre) grupo.nombre = dto.nombre;
    if (dto.semestre) grupo.semestre = Number(dto.semestre);

    return await this.groupRepo.save(grupo);
  }

  // 4. ELIMINAR GRUPO (PROTEGIDO)
  async deleteGroup(id: string) {
    const grupo = await this.groupRepo.findOne({ where: { id } });
    if (!grupo) throw new NotFoundException('Grupo no encontrado');

    const totalAlumnos = await this.enrollmentRepo.count({ where: { group: { id } } });
    
    if (totalAlumnos > 0) {
      throw new BadRequestException('No se puede eliminar un grupo que tiene alumnos inscritos.');
    }

    return await this.groupRepo.delete(id);
  }

  // 5. REGISTRO DE ALUMNO (DINÁMICO SaaS)
  async addStudentToGroup(dto: AddStudentDto, schoolId: string) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('Escuela no encontrada');

    const dominio = school.dominioEscuela || 'escuela.com'; 
    const email = `${dto.matricula.toLowerCase()}@${dominio}`;
    
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const pass = await bcrypt.hash(dto.matricula.trim(), salt);
      user = await this.userRepo.save(this.userRepo.create({ 
        email, 
        password: pass, 
        fullName: dto.nombre, 
        rol: UserRole.ALUMNO, 
        school: { id: schoolId } 
      }));
    }

    let profile = await this.profileRepo.findOne({ where: { user: { id: user.id } } });
    if (!profile) {
      const nuevoPerfil = this.profileRepo.create({ 
        matricula: dto.matricula, 
        user: user, 
        nombreCompleto: dto.nombre,
        curp: `PEND-${dto.matricula}`, 
        genero: 'OTRO', 
        tipoSangre: 'O+', 
        telefono: '0000000000',
        direccion: 'DATO PENDIENTE',
        fechaNacimiento: new Date(),
        gradoActual: "1"
      });
      profile = await this.profileRepo.save(nuevoPerfil);
    }

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(dto.grupoId);
    let targetGroupId = dto.grupoId;
    if (!isUuid) {
      const g = await this.groupRepo.findOne({ where: { nombre: dto.grupoId } });
      if (!g) throw new NotFoundException(`El grupo ${dto.grupoId} no existe.`);
      targetGroupId = g.id;
    }

    const isEnrolled = await this.enrollmentRepo.findOne({ 
      where: { student: { id: profile.id }, group: { id: targetGroupId } } 
    });

    if (isEnrolled) return isEnrolled;
    
    return await this.enrollmentRepo.save(this.enrollmentRepo.create({ 
        student: { id: profile.id }, 
        group: { id: targetGroupId }, 
        estado: EnrollmentStatus.ACTIVO 
    }));
  }

  // 6. LISTAR ALUMNOS POR GRUPO
  async getStudentsByGroup(groupIdentifier: string) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(groupIdentifier);
    let targetId = groupIdentifier;
    if (!isUuid) {
      const g = await this.groupRepo.findOne({ where: { nombre: groupIdentifier } });
      if (!g) return [];
      targetId = g.id;
    }
    const inscripciones = await this.enrollmentRepo.find({ 
        where: { group: { id: targetId } }, 
        relations: ['student'] 
    });
    return inscripciones.map(i => ({ 
      id: i.student?.id, 
      matricula: i.student?.matricula, 
      nombre: i.student?.nombreCompleto 
    }));
  }

  // 7. ELIMINAR ALUMNO (CASCADA MANUAL)
  async deleteStudent(studentId: string) {
    const profile = await this.profileRepo.findOne({ 
      where: { id: studentId }, 
      relations: ['user'] 
    });

    if (!profile) throw new NotFoundException('Alumno no encontrado');

    const userId = profile.user.id;
    await this.enrollmentRepo.delete({ student: { id: studentId } });
    await this.profileRepo.delete(studentId);
    return await this.userRepo.delete(userId);
  }

  // 8. HISTORIAL Y PERFIL
  async getStudentAcademicHistory(studentId: string) {
    const student = await this.profileRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('No encontrado');
    return { id: student.id, nombre: student.nombreCompleto, matricula: student.matricula, calificaciones: [] };
  }

  async getAlumnoFullProfile(id: string) {
    const student = await this.profileRepo.findOne({ where: { id }, relations: ['user'] });
    if (!student) throw new NotFoundException('No encontrado');
    return { ...student, nombre: student.nombreCompleto, matricula: student.matricula };
  }
}