import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ENTIDADES
import { User } from '../users/entities/user.entity';
import { School } from '../tenants/entities/school.entity';
import { AdminProfile } from './entities/admin-profile.entity';
import { Message } from './entities/message.entity';
import { AcademicPeriod } from '../academic/entities/academic-period.entity';
import { Subject } from '../academic/entities/subject.entity';
import { GradeCard } from '../academic/entities/grade-card.entity';
import { Course } from '../academic/entities/course.entity';
import { Group } from '../academic/entities/group.entity';
import { Enrollment } from '../academic/entities/enrollment.entity';
import { StudentProfile } from '../student/entities/student-profile.entity';
import { TeacherProfile } from '../teacher/entities/teacher-profile.entity';

// DTOs
import { CreateMessageDto } from './dtos/create-message.dto';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AddStudentDto } from './dtos/add-student-to-group.dto';
import { CreateDocenteDto } from './dtos/create-docente.dto';
import { UserRole } from '../shared/enums/user-role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(School) private schoolRepository: Repository<School>,
    @InjectRepository(AdminProfile) private adminProfileRepo: Repository<AdminProfile>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(AcademicPeriod) private periodRepo: Repository<AcademicPeriod>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(GradeCard) private gradeCardRepo: Repository<GradeCard>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(StudentProfile) private studentProfileRepo: Repository<StudentProfile>,
    @InjectRepository(TeacherProfile) private teacherProfileRepo: Repository<TeacherProfile>,
  ) {}

  // --- DASHBOARD ---
  async getDashboardData(schoolId: string, userId: string) {
    const school = await this.schoolRepository.findOne({ where: { id: schoolId } });
    const docs = await this.userRepository.count({ where: { school: { id: schoolId }, rol: UserRole.DOCENTE } });
    const alums = await this.userRepository.count({ where: { school: { id: schoolId }, rol: UserRole.ALUMNO } });
    return { bienvenida: `Panel de ${school?.nombreEscuela || 'Escuela'}`, metricas: { docentes: docs, alumnos: alums } };
  }

  // --- GRUPOS ---
  async getGroups(schoolId: string) {
    const grupos = await this.groupRepo.find({ where: { period: { school: { id: schoolId } } }, order: { nombre: 'ASC' } });
    return await Promise.all(grupos.map(async (g) => {
      const count = await this.enrollmentRepo.count({ where: { group: { id: g.id } } });
      return { id: g.id, nombre: `GRUPO ${g.nombre}`, alumnos: count, grado: g.semestre || 1 };
    }));
  }

  async saveGroup(dto: CreateGroupDto, schoolId: string) {
    const periodo = await this.periodRepo.findOne({ where: { school: { id: schoolId } }, order: { fechaInicio: 'DESC' } });
    if (!periodo) throw new NotFoundException('Crea un ciclo primero');
    const data = { ...(dto.id && dto.id !== '0' ? { id: dto.id } : {}), nombre: dto.nombre, semestre: dto.semestre || 1, limiteAlumnos: dto.limiteAlumnos, period: periodo };
    return await this.groupRepo.save(data as any);
  }

  // --- DOCENTES ---
  async getDocentes(schoolId: string) {
    const docentes = await this.teacherProfileRepo.find({ where: { user: { school: { id: schoolId } } }, relations: ['user'], order: { user: { email: 'ASC' } } });
    return docentes.map(d => ({ id: d.id, clave: d.claveEmpleado, nombre: d.user?.email.split('@')[0].toUpperCase() || 'DOCENTE', email: d.user?.email, especialidad: d.especialidad }));
  }

  async createDocente(dto: CreateDocenteDto, schoolId: string) {
    const newUser = await this.userRepository.save(this.userRepository.create({ email: dto.email, password: dto.clave, rol: UserRole.DOCENTE, school: { id: schoolId } }));
    return await this.teacherProfileRepo.save(this.teacherProfileRepo.create({ claveEmpleado: dto.clave, especialidad: dto.especialidad, telefono: dto.telefono, tituloAcademico: 'Lic.', user: newUser }));
  }

  async getDocenteProfileById(id: string) {
    const d = await this.teacherProfileRepo.findOne({ where: { id }, relations: ['user', 'courses', 'courses.subject', 'courses.group'] });
    if (!d) throw new NotFoundException('Docente no encontrado');
    const materiasAsignadas = d.courses?.map(c => ({ id: c.id, nombre: c.subject?.nombre || 'Materia', grupo: c.group?.nombre || 'Sin grupo' })) || [];
    return {
      id: d.id, clave: d.claveEmpleado, nombre: d.user?.email.split('@')[0].toUpperCase() || 'DOCENTE', email: d.user?.email, telefono: d.telefono, especialidad: d.especialidad,
      materiasAsignadas, horario: d.habilidades ? JSON.parse(d.habilidades) : { Lunes: {}, Martes: {}, Miercoles: {}, Jueves: {}, Viernes: {} }
    };
  }

  async updateDocenteProfile(id: string, data: any) {
    const profile = await this.teacherProfileRepo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    if (data.clave) profile.claveEmpleado = data.clave;
    if (data.especialidad) profile.especialidad = data.especialidad;
    if (data.telefono) profile.telefono = data.telefono;
    if (data.horario) profile.habilidades = JSON.stringify(data.horario);
    if (data.email && profile.user) { profile.user.email = data.email; await this.userRepository.save(profile.user); }
    return await this.teacherProfileRepo.save(profile);
  }

  async deleteDocente(docenteId: string) {
    const profile = await this.teacherProfileRepo.findOne({ where: { id: docenteId }, relations: ['user'] });
    if (profile && profile.user) await this.userRepository.delete(profile.user.id);
    return { status: 'success' };
  }

  // --- ALUMNOS ---
  async getStudentsByGroup(groupId: string) {
    const ins = await this.enrollmentRepo.find({ where: { group: { id: groupId } }, relations: ['student', 'student.user'] });
    return ins.map((i, idx) => ({ id: i.student?.id, numero: idx + 1, matricula: i.student?.matricula || 'S/M', nombre: i.student?.user?.email || 'N/A' }));
  }

  async addStudentToGroup(dto: AddStudentDto, schoolId: string) {
    const email = `${dto.matricula.toLowerCase()}@escuela.com`;
    const user = await this.userRepository.save(this.userRepository.create({ email, password: dto.matricula, rol: UserRole.ALUMNO, school: { id: schoolId } }));
    const profile = await this.studentProfileRepo.save(this.studentProfileRepo.create({ 
      matricula: dto.matricula, curp: `TEMP-${dto.matricula}`, fechaNacimiento: new Date(), genero: 'N/A', telefono: '000', direccion: 'PENDIENTE', gradoActual: '1', user 
    }));
    return await this.enrollmentRepo.save({ student: profile, group: { id: dto.grupoId } as any, fechaInscripcion: new Date() } as any);
  }

  async getStudentAcademicHistory(studentId: string) {
    const student = await this.studentProfileRepo.findOne({ where: { id: studentId }, relations: ['user'] });
    if (!student) throw new NotFoundException('Alumno no encontrado');
    const ins = await this.enrollmentRepo.find({ where: { student: { id: studentId } }, relations: ['group', 'group.period'] });
    const b = await this.gradeCardRepo.find({ where: { enrollment: { student: { id: studentId } } }, relations: ['course', 'course.subject', 'course.group', 'course.group.period'] });
    const c = b.map(x => ({ materia: x.course?.subject?.nombre || 'Materia', calificacion: Number(x.promedioFinal || 0), asistencia: `${x.porcentajeAsistenciaGlobal || 0}%`, ciclo: x.course?.group?.period?.nombre || 'N/A' }));
    const prom = c.length > 0 ? c.reduce((acc, curr) => acc + curr.calificacion, 0) / c.length : 0;
    return { alumno: { id: student.id, nombre: student.user?.email.split('@')[0].toUpperCase(), matricula: student.matricula }, inscripciones: ins.map(e => ({ ciclo: e.group?.period?.nombre || 'N/A', estado: 'Completado', fecha: e.fechaInscripcion })), calificaciones: c, promedioGeneral: prom.toFixed(1) };
  }

  async exportStudentAcademicHistory(studentId: string): Promise<string> {
    const data = await this.getStudentAcademicHistory(studentId);
    let csv = `Alumno:,${data.alumno.nombre}\nMateria,Ciclo,Calificacion,Asistencia\n`;
    data.calificaciones.forEach(c => { csv += `${c.materia},${c.ciclo},${c.calificacion},${c.asistencia}\n`; });
    return csv;
  }
}