import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ENTIDADES
import { User } from '../users/entities/user.entity';
import { School } from '../tenants/entities/school.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { Message } from './entities/message.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { TeacherProfile } from '../teacher/entities/teacher-profile.entity';
import { GradeCard } from '../academic/entities/grade-card.entity';

// ENUMS Y DTOS
import { UserRole } from '../shared/enums/user-role.enum';
import { EnrollmentStatus } from '../shared/enums/enrollment-status.enum'; 
import { CreateGroupDto } from './dtos/create-group.dto';
import { AddStudentDto } from './dtos/add-student-to-group.dto';
import { CreateDocenteDto } from './dtos/create-docente.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(School) private schoolRepository: Repository<School>,
    @InjectRepository(AdminProfile) private adminProfileRepo: Repository<AdminProfile>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(AcademicPeriod) private periodRepo: Repository<AcademicPeriod>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(StudentProfile) private studentProfileRepo: Repository<StudentProfile>,
    @InjectRepository(TeacherProfile) private teacherProfileRepo: Repository<TeacherProfile>,
    @InjectRepository(GradeCard) private gradeCardRepo: Repository<GradeCard>,
  ) {}

  // --- CICLOS ESCOLARES (Esta es la que faltaba) ---
  async createPeriod(dto: any, schoolId: string) {
    return await this.periodRepo.save(this.periodRepo.create({ ...dto, school: { id: schoolId } }));
  }

  async setActualPeriod(periodId: string, schoolId: string) {
    await this.periodRepo.update({ school: { id: schoolId } }, { esActual: false });
    const result = await this.periodRepo.update({ id: periodId, school: { id: schoolId } }, { esActual: true });
    if (result.affected === 0) throw new NotFoundException('Ciclo no encontrado');
    return { message: 'Ciclo escolar activado correctamente' };
  }

  // --- ALUMNOS (Registro con dominio institucional) ---
  async addStudentToGroup(dto: AddStudentDto, schoolId: string) {
    const school = await this.schoolRepository.findOne({ where: { id: schoolId } });
    const dominio = school?.dominioEscuela || 'tec-pro-v2.edu.mx'; 

    const emailInstitucional = `${dto.matricula.toLowerCase().trim()}@${dominio}`;
    const passwordLimpia = dto.matricula.trim();

    const baseMat = dto.matricula.replace(/[^a-zA-Z0-9]/g, '');
    const curpTecnica = `T${baseMat}`.substring(0, 15) + Math.floor(100 + Math.random() * 899);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordLimpia, salt);
    
    const user = await this.userRepository.save(this.userRepository.create({ 
      email: emailInstitucional, 
      password: hashedPassword, 
      fullName: dto.nombreCompleto, 
      rol: UserRole.ALUMNO, 
      school: { id: schoolId } 
    }));
    
    const profile = await this.studentProfileRepo.save(this.studentProfileRepo.create({ 
      matricula: dto.matricula, 
      user: user, 
      nombreCompleto: dto.nombreCompleto, 
      curp: curpTecnica, 
      fechaNacimiento: new Date('2000-01-01'), 
      genero: 'N/A', 
      telefono: '0000000000', 
      direccion: 'Pendiente', 
      gradoActual: '1' 
    }));
    
    return await this.enrollmentRepo.save(this.enrollmentRepo.create({ 
      student: { id: profile.id }, 
      group: { id: dto.grupoId }, 
      fechaInscripcion: new Date(), 
      estado: EnrollmentStatus.ACTIVO 
    }));
  }

  // --- GESTIÓN DE GRUPOS ---
  async saveGroup(dto: CreateGroupDto, schoolId: string) {
    const periodo = await this.periodRepo.findOne({ where: { school: { id: schoolId }, esActual: true } });
    if (!periodo) throw new BadRequestException('No hay un ciclo activo');
    return await this.groupRepo.save(this.groupRepo.create({ ...dto, period: periodo }));
  }

  async getGroups(schoolId: string) {
    const grupos = await this.groupRepo.find({ where: { period: { school: { id: schoolId } } }, order: { nombre: 'ASC' } });
    return await Promise.all(grupos.map(async (g) => {
      const count = await this.enrollmentRepo.count({ where: { group: { id: g.id } } });
      return { id: g.id, nombre: `GRUPO ${g.nombre}`, alumnos: count, grado: g.semestre || 1 };
    }));
  }

  async getStudentsByGroup(groupId: string) {
    const ins = await this.enrollmentRepo.find({ where: { group: { id: groupId } }, relations: ['student', 'student.user'] });
    return ins.map((i, idx) => ({ 
      id: i.student?.id, 
      numero: idx + 1, 
      matricula: i.student?.matricula, 
      nombre: i.student?.nombreCompleto 
    }));
  }

  // --- DOCENTES ---
  async createDocente(dto: CreateDocenteDto, schoolId: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.clave, salt);
    const newUser = await this.userRepository.save(this.userRepository.create({ 
      email: dto.email, password: hashedPassword, fullName: dto.nombre, rol: UserRole.DOCENTE, school: { id: schoolId } 
    }));
    return await this.teacherProfileRepo.save(this.teacherProfileRepo.create({ 
      claveEmpleado: dto.clave, especialidad: dto.especialidad, telefono: dto.telefono, user: newUser 
    }));
  }

  async getDocentes(schoolId: string) {
    return await this.teacherProfileRepo.find({ where: { user: { school: { id: schoolId } } }, relations: ['user'] });
  }

  // --- DASHBOARD ---
  async getDashboardData(schoolId: string, userId: string) {
    const school = await this.schoolRepository.findOne({ where: { id: schoolId } });
    const docs = await this.userRepository.count({ where: { school: { id: schoolId }, rol: UserRole.DOCENTE } });
    const alums = await this.userRepository.count({ where: { school: { id: schoolId }, rol: UserRole.ALUMNO } });
    return { bienvenida: `Panel de ${school?.nombreEscuela || 'Escuela'}`, metricas: { docentes: docs, alumnos: alums } };
  }

  async getDocenteProfileById(id: string) { return this.teacherProfileRepo.findOne({ where: { id }, relations: ['user'] }); }
  async updateDocenteProfile(id: string, data: any) { return this.teacherProfileRepo.update(id, data); }
  async deleteDocente(id: string) { return this.teacherProfileRepo.delete(id); }

  async getStudentAcademicHistory(studentId: string) {
    const student = await this.studentProfileRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Alumno no encontrado');
    const grades = await this.gradeCardRepo.find({ where: { enrollment: { student: { id: studentId } } }, relations: ['course', 'course.subject'] });
    return { alumno: student, calificaciones: grades };
  }

  async exportStudentAcademicHistory(studentId: string): Promise<string> {
    const data = await this.getStudentAcademicHistory(studentId);
    return `Alumno:,${data.alumno.nombreCompleto}\nMateria,Calificacion\n` + data.calificaciones.map(g => `${g.course?.subject?.nombre},${g.promedioFinal}`).join('\n');
  }
}