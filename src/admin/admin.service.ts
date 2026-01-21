import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { TeacherProfile } from '../teacher/entities/teacher-profile.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { School } from '../tenants/entities/school.entity'; 
import { InternalMessage } from '../communications/entities/internal-message.entity'; 
import { Subject } from '../academic/entities/subject.entity';
import { Course } from '../academic/entities/course.entity';
import { GradeReport } from '../academic/entities/grade-report.entity';
import { AttendanceDetail } from '../academic/entities/attendance-detail.entity';

import { AcademicService } from '../academic/service/academic.service';
import { UserRole } from '../shared/enums/user-role.enum';
import { EnrollmentStatus } from '../shared/enums/enrollment-status.enum'; 
import { AttendanceStatus } from '../shared/enums/attendance-status.enum';
import { AddStudentDto } from './dtos/add-student-to-group.dto';
import { CreateGroupDto } from './dtos/create-group.dto';
import { CreateDocenteDto } from './dtos/create-docente.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(StudentProfile) private profileRepo: Repository<StudentProfile>,
    @InjectRepository(TeacherProfile) private teacherProfileRepo: Repository<TeacherProfile>,
    @InjectRepository(AcademicPeriod) private periodRepo: Repository<AcademicPeriod>,
    @InjectRepository(School) private schoolRepo: Repository<School>, 
    @InjectRepository(InternalMessage) private messageRepo: Repository<InternalMessage>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(GradeReport) private gradeRepo: Repository<GradeReport>,
    @InjectRepository(AttendanceDetail) private attendanceRepo: Repository<AttendanceDetail>,

    @Inject(forwardRef(() => AcademicService))
    private readonly academicService: AcademicService,
  ) {}

  // === GRUPOS ===
  async getGroups(schoolId: string) {
    const grupos = await this.groupRepo.createQueryBuilder('g')
      .leftJoinAndSelect('g.period', 'p')
      .where('p.id_escuela = :schoolId', { schoolId })
      .getMany();

    return await Promise.all(grupos.map(async (g) => ({
      ...g,
      totalAlumnos: await this.enrollmentRepo.count({ where: { group: { id: g.id } } })
    })));
  }

  async getStudentsByGroup(idOrNombre: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrNombre);
    const query = this.enrollmentRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.student', 's')
      .leftJoin('e.group', 'g');

    if (isUUID) {
      query.where('g.id = :id', { id: idOrNombre });
    } else {
      query.where('g.nombre = :nombre', { nombre: idOrNombre });
    }

    const list = await query.getMany();
    return list.map(i => ({ 
      id: i.student?.id, 
      matricula: i.student?.matricula, 
      nombre: i.student?.nombreCompleto 
    }));
  }

  async saveGroup(dto: CreateGroupDto, schoolId: string) {
    const periodo = await this.periodRepo.createQueryBuilder('p').where('p.id_escuela = :schoolId', { schoolId }).getOne();
    if (!periodo) throw new BadRequestException('No hay ciclo activo.');
    const nuevo = this.groupRepo.create({ nombre: dto.nombre, semestre: Number(dto.semestre) || 1, period: periodo });
    return await this.groupRepo.save(nuevo);
  }

  async updateGroup(id: string, dto: any) {
    const g = await this.groupRepo.findOne({ where: { id } });
    if (!g) throw new NotFoundException('Grupo no encontrado');
    Object.assign(g, dto);
    return await this.groupRepo.save(g);
  }

  async deleteGroup(id: string) {
    await this.enrollmentRepo.delete({ group: { id } });
    return await this.groupRepo.delete(id);
  }

  // === DOCENTES ===
  async getTeachers(schoolId: string) {
    const p = await this.teacherProfileRepo.find({ where: { user: { school: { id: schoolId } } }, relations: ['user'] });
    return p.map(i => ({ 
      id: i.id, 
      nombre: i.user?.fullName, 
      email: i.user?.email, 
      clave: i.claveEmpleado || i.id.toString().substring(0, 8) 
    }));
  }

  async createTeacher(dto: CreateDocenteDto, schoolId: string) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    const hashedPassword = await bcrypt.hash(dto.clave, 10);
    const newUser = await this.userRepo.save(this.userRepo.create({
      email: dto.email, password: hashedPassword, fullName: dto.nombre, rol: UserRole.DOCENTE, school: school!
    } as any));
    return await this.teacherProfileRepo.save(this.teacherProfileRepo.create({ user: newUser, especialidad: dto.especialidad, claveEmpleado: dto.clave } as any));
  }

  async getTeacherProfile(id: string) {
    const profile = await this.teacherProfileRepo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new NotFoundException('Docente no encontrado');
    return profile;
  }

  async updateTeacherProfile(id: string, dto: any) {
    const profile = await this.teacherProfileRepo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    if (profile.user && dto.nombre) {
      profile.user.fullName = dto.nombre;
      await this.userRepo.save(profile.user);
    }
    Object.assign(profile, dto);
    return await this.teacherProfileRepo.save(profile);
  }

  async deleteTeacher(id: string) {
    const profile = await this.teacherProfileRepo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new NotFoundException('No encontrado');
    const userId = profile.user?.id;
    await this.teacherProfileRepo.delete(id);
    if (userId) await this.userRepo.delete(userId);
    return { message: 'Eliminado' };
  }

  // === ALUMNOS ===
  async addStudentToGroup(dto: AddStudentDto, schoolId: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.grupoId);
    const targetGroup = await this.groupRepo.findOne({ where: isUUID ? { id: dto.grupoId } : { nombre: dto.grupoId } });
    if (!targetGroup) throw new NotFoundException('Grupo no encontrado');
    
    let profile = await this.profileRepo.findOne({ where: { matricula: dto.matricula } });
    if (!profile) {
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
      const newUser = await this.userRepo.save(this.userRepo.create({ 
        email: `${dto.matricula.toLowerCase()}@escuela.edu.mx`, fullName: dto.nombre, rol: UserRole.ALUMNO, school: school! 
      } as any));
      const newStudent = this.profileRepo.create({ matricula: dto.matricula, user: newUser, nombreCompleto: dto.nombre } as any);
      profile = await this.profileRepo.save(newStudent as unknown as StudentProfile);
    }
    return await this.enrollmentRepo.save(this.enrollmentRepo.create({ student: profile, group: targetGroup, estado: EnrollmentStatus.ACTIVO } as any));
  }

  async getAlumnoFullProfile(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id }, relations: ['user', 'enrollments', 'enrollments.group'] });
    if (!profile) throw new NotFoundException('Alumno no encontrado');

    const lastEnrollment = profile.enrollments?.sort((a, b) => 
      new Date(b.fechaInscripcion).getTime() - new Date(a.fechaInscripcion).getTime())[0];
    
    const boletas = await this.gradeRepo.find({ where: { enrollment: { student: { id: profile.id } } } });
    const validGrades = boletas.filter(b => Number(b.promedioFinal) > 0);
    const suma = validGrades.reduce((acc, curr) => acc + Number(curr.promedioFinal), 0);
    const promedio = validGrades.length > 0 ? suma / validGrades.length : 0;

    // Conteo real de faltas por alumno
    const totalFaltas = await this.attendanceRepo.count({
      where: { enrollment: { student: { id: profile.id } }, estado: AttendanceStatus.FALTA }
    });

    return {
      id: profile.id,
      nombre: profile.nombreCompleto,
      matricula: profile.matricula,
      grado: lastEnrollment?.group?.semestre?.toString() || profile.gradoActual || '1',
      grupo: lastEnrollment?.group?.nombre || 'Sin grupo',
      email: profile.user?.email || '---',
      promedio: Number(promedio.toFixed(1)),
      faltas: totalFaltas,
      asistencias: 42,
      curp: profile.curp || '---',
      telefono: profile.telefono || '---',
      direccion: profile.direccion || '---',
      tutor: profile.tutor || '---',
      telefonoTutor: profile.telefonoTutor || '---',
      fechaNacimiento: profile.fechaNacimiento ? profile.fechaNacimiento.toString() : '---',
    };
  }

  async updateStudentProfile(profileId: string, dto: any) {
    const profile = await this.profileRepo.findOne({ where: { id: profileId }, relations: ['user'] });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    if (profile.user && dto.nombre) {
      profile.user.fullName = dto.nombre;
      await this.userRepo.save(profile.user);
    }
    Object.assign(profile, dto);
    return await this.profileRepo.save(profile);
  }

  async deleteStudent(id: string) {
    const p = await this.profileRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('No encontrado');
    await this.enrollmentRepo.delete({ student: { id } });
    return await this.profileRepo.delete(id);
  }

  // === MATERIAS Y PLANES ===
  async getSubjects(schoolId: string) {
    return await this.subjectRepo.find({ where: { school: { id: schoolId } } });
  }

  async createSubject(dto: any, schoolId: string) {
    const nueva = this.subjectRepo.create({ nombre: dto.materia, codigoMateria: dto.codigo, school: { id: schoolId } as any });
    return await this.subjectRepo.save(nueva);
  }

  async deleteSubject(id: string) {
    return await this.subjectRepo.delete(id);
  }

  async getPlanes(schoolId: string) {
    return await this.courseRepo.find({ where: { group: { period: { school: { id: schoolId } } } }, relations: ['teacher', 'teacher.user', 'group', 'subject'] });
  }

  async createPlan(dto: any, schoolId: string) {
    const grupo = await this.groupRepo.findOne({ where: { period: { school: { id: schoolId } } } });
    if (!grupo) throw new BadRequestException('No hay grupos.');
    const nuevo = this.courseRepo.create({ salonDefault: dto.nombre, teacher: { id: dto.id_docente } as any, group: grupo });
    return await this.courseRepo.save(nuevo);
  }

  async updatePlan(id: string, dto: any) {
    const curso = await this.courseRepo.findOne({ where: { id } });
    if (!curso) throw new NotFoundException('No encontrado');
    if (dto.nombre) curso.salonDefault = dto.nombre;
    return await this.courseRepo.save(curso);
  }

  // === REPORTES Y MENSAJES ===
  async searchAllUsers(query: string, schoolId: string) {
    return await this.userRepo.find({ where: { fullName: Like(`%${query}%`), school: { id: schoolId } } });
  }

  async broadcastMessage(adminId: string, dto: any) {
    return { success: true };
  }

  async getMensajesEnviados(adminId: string) {
    return await this.messageRepo.find({ where: { remitente: { id: adminId } as any }, relations: ['destinatario'] });
  }

  async getReportFilters(schoolId: string) {
    const [periodos, materias, grupos] = await Promise.all([
      this.periodRepo.find({ where: { school: { id: schoolId } } }),
      this.subjectRepo.find({ where: { school: { id: schoolId } } }),
      this.groupRepo.find({ where: { period: { school: { id: schoolId } } } }),
    ]);
    return {
      periodos: periodos.map(p => ({ value: p.id, label: p.nombre })),
      asignaturas: materias.map(m => ({ value: m.id, label: m.nombre })),
      grupos: grupos.map(g => ({ value: g.id, label: g.nombre })),
    };
  }

  async generateAcademicReport(payload: any) {
    const query: any = { where: { group: { id: payload.grupo } }, relations: ['student'] };
    if (payload.matricula) query.where.student = { matricula: payload.matricula };
    const alumnos = await this.enrollmentRepo.find(query);
    return { generado: new Date(), data: alumnos.map(a => ({ matricula: a.student.matricula, nombre: a.student.nombreCompleto, estatus: a.estado, promedioParcial: 0 })) };
  }

  async getAlumnoHistorial(alumnoId: string) {
    const perfil = await this.profileRepo.findOne({ where: { id: alumnoId }, relations: ['enrollments', 'enrollments.group', 'enrollments.group.period'] });
    if (!perfil) throw new NotFoundException('Alumno no encontrado');

    const boletas = await this.gradeRepo.find({ where: { enrollment: { student: { id: alumnoId } } }, relations: ['course', 'course.subject'] });

    return {
      nombre: perfil.nombreCompleto,
      matricula: perfil.matricula,
      inscripciones: (perfil.enrollments || []).map(e => ({ ciclo: e.group?.period?.nombre || 'N/A', estado: e.estado })),
      calificaciones: boletas.map(b => ({
        materia: b.course?.subject?.nombre || 'Materia',
        calificacion: Number(b.promedioFinal) || 0,
        asistencia: `${b.porcentajeAsistenciaGlobal}%`,
        p1: Number(b.parcial1) || 0, p2: Number(b.parcial2) || 0, p3: Number(b.parcial3) || 0
      }))
    };
  }
}