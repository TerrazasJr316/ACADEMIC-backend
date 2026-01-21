/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// Entidades (Fusión de todas las necesarias)
import { TeacherProfile } from '../../teacher/entities/teacher-profile.entity';
import { Course } from '../entities/course.entity';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../../users/entities/user.entity';
import { GradeCard } from '../entities/grade-card.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Group } from '../entities/group.entity';
import { AttendanceDetail } from '../entities/attendance-detail.entity';
import { InternalMessage } from '../../communications/entities/internal-message.entity';
import { Subject } from '../entities/subject.entity';

// Enums
import { AttendanceStatus } from '../../shared/enums/attendance-status.enum';

export interface GradeInput {
  id: string;
  parcial1: string | number;
  parcial2: string | number;
  parcial3: string | number;
  final: string | number;
  extraordinario?: string | number | null;
}

@Injectable()
export class AcademicService {
  constructor(
    @InjectRepository(TeacherProfile) private readonly teacherRepo: Repository<TeacherProfile>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Schedule) private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(GradeCard) private readonly gradeRepo: Repository<GradeCard>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(AttendanceDetail) private readonly attendanceRepo: Repository<AttendanceDetail>,
    @InjectRepository(InternalMessage) private readonly msgRepo: Repository<InternalMessage>,
    @InjectRepository(Subject) private readonly subjectRepo: Repository<Subject>,
  ) { }

  // =================================================================
  //  1. LÓGICA DE ALUMNOS (Tu código para filtrar materias y horarios)
  // =================================================================
  async getStudentCourses(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { student: { user: { id: userId } } },
      relations: ['group'],
    });

    const validEnrollments = enrollments.filter(e => e.group);
    if (!validEnrollments.length) return [];

    const groupIds = validEnrollments.map((e) => e.group.id);

    const courses = await this.courseRepo.find({
      where: { group: { id: In(groupIds) } },
      relations: ['subject', 'teacher', 'teacher.user', 'schedules', 'group'],
    });

    const materiasMap = new Map<string, any>();

    courses.forEach((c) => {
      const nombreMateria = c.subject?.nombre || 'Sin Nombre';
      const nuevosHorarios = c.schedules?.map((s) => ({
        dia: s.diaSemana,
        hora: `${s.horaInicio.toString().slice(0, 5)} - ${s.horaFin.toString().slice(0, 5)}`,
      })) || [];

      if (materiasMap.has(nombreMateria)) {
        const existente = materiasMap.get(nombreMateria);
        existente.horarios = [...existente.horarios, ...nuevosHorarios];
      } else {
        materiasMap.set(nombreMateria, {
          id: c.id,
          materia: nombreMateria,
          profesor: c.teacher?.user?.fullName || 'Por asignar',
          semestre: c.group?.semestre || 1,
          horarios: nuevosHorarios
        });
      }
    });

    return Array.from(materiasMap.values());
  }

  async getStudentProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['studentProfile']
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const profile = user.studentProfile;
    const matricula = profile?.matricula || 'S/M';
    let grado = profile?.gradoActual || '1';

    if (profile && (!grado || grado === 'N/A')) {
      const lastEnrollment = await this.enrollmentRepo.findOne({
        where: { student: { id: profile.id } },
        relations: ['group'],
        order: { fechaInscripcion: 'DESC' }
      });
      if (lastEnrollment && lastEnrollment.group) {
        grado = lastEnrollment.group.semestre.toString();
      }
    }

    let promedio = 0;
    let aprobadas = 0;

    if (profile) {
      const grades = await this.gradeRepo.find({
        where: { enrollment: { student: { id: profile.id } } },
        select: ['promedioFinal'],
      });

      const validGrades = grades.filter(g => Number(g.promedioFinal) > 0);
      const suma = validGrades.reduce((acc, curr) => acc + Number(curr.promedioFinal), 0);
      promedio = validGrades.length > 0 ? suma / validGrades.length : 0;
      aprobadas = grades.filter(g => Number(g.promedioFinal) >= 70).length;
    }

    return {
      resumen: {
        name: user.fullName, id: matricula, career: 'Ingeniería en Sistemas',
        semester: `${grado}° Semestre`, average: Number(promedio.toFixed(1)),
      },
      personal: {
        fullName: profile?.nombreCompleto || user.fullName, id: matricula,
        birthDate: profile?.fechaNacimiento ? profile.fechaNacimiento.toString() : '---',
        gender: profile?.genero || '---', email: user.email,
        phone: profile?.telefono || '---', address: profile?.direccion || '---', curp: profile?.curp || '---',
      },
      academic: {
        semester: `${grado}° Semestre`, average: Number(promedio.toFixed(1)),
        status: user.isActive ? 'Activo' : 'Inactivo', approvedSubjects: aprobadas,
      },
      payment: { balanceDue: 0.00 }
    };
  }

  // =================================================================
  //  2. LÓGICA DE DOCENTES (Código Multi-Escuela de tu compañero)
  // =================================================================
  async getProfile(userId: string) {
    return this.teacherRepo.findOne({ where: { user: { id: userId } }, relations: ['user', 'user.school'] });
  }

  async updateProfile(userId: string, data: any) {
    const teacher = await this.teacherRepo.findOne({ 
      where: [{ user: { id: userId } }],
      relations: ['user', 'user.school'] 
    });

    if (!teacher || !teacher.user || !teacher.user.school) {
      throw new NotFoundException('Docente o Escuela no identificados');
    }

    const schoolId = teacher.user.school.id;

    await this.teacherRepo.update(teacher.id, {
      especialidad: data.especialidad,
      telefono: data.telefono,
      claveEmpleado: data.claveEmpleado || data.clave
    });

    if (data.horario) {
      const myCourses = await this.courseRepo.find({
        where: { teacher: { id: teacher.id } },
        relations: ['subject', 'group']
      });

      const schoolSubjects = await this.subjectRepo.find({ where: { school: { id: schoolId } } });
      const schoolGroups = await this.groupRepo.find({
        where: { period: { school: { id: schoolId } } } as any
      });

      const clean = (s: string) => s?.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || '';

      for (const [dia, slots] of Object.entries(data.horario)) {
        for (const [horaInicio, descripcion] of Object.entries(slots as any)) {
          const match = (descripcion as string).match(/^(.*)\s+\((.*)\)\s+\[\s*(.*)\s*-\s*(.*)\s*\]$/);
          if (match) {
            const frontMat = clean(match[1]);
            const frontGrp = clean(match[2]).replace(/\s/g, ""); 
            const hFin = match[4].trim();

            let curso = myCourses.find(c => {
              const dbMat = c.subject ? clean(c.subject.nombre) : '';
              const dbGrp = clean(c.group?.nombre || '').replace(/\s/g, "");
              return (dbMat === frontMat && dbGrp === frontGrp);
            });

            if (!curso) {
              const targetGroup = schoolGroups.find(g => clean(g.nombre).replace(/\s/g, "") === frontGrp);
              const targetSubject = schoolSubjects.find(s => clean(s.nombre) === frontMat);

              if (targetGroup && targetSubject) {
                curso = await this.courseRepo.save(this.courseRepo.create({
                  teacher: teacher, group: targetGroup, subject: targetSubject, salonDefault: 'Aula General'
                }));
                myCourses.push(curso); 
              }
            }

            if (curso) {
              const hInDB = horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio;
              const hFinDB = hFin.length === 5 ? `${hFin}:00` : hFin;

              await this.scheduleRepo.delete({
                course: { id: curso.id }, diaSemana: dia.toUpperCase() as any, horaInicio: hInDB
              });

              await this.scheduleRepo.save({
                course: { id: curso.id } as any, diaSemana: dia.toUpperCase() as any,
                horaInicio: hInDB, horaFin: hFinDB, aulaEspecifica: 'Aula General'
              });
            }
          }
        }
      }
    }
    return { success: true };
  }

  // =================================================================
  //  MÉTODOS COMPARTIDOS (Dashboards, Asistencias, Mensajes)
  // =================================================================
  async getStudentDashboardSummary(userId: string) {
    const boletas = await this.gradeRepo.find({
      where: { enrollment: { student: { user: { id: userId } } } },
      select: ['promedioFinal'],
    });
    const validGrades = boletas.filter(b => Number(b.promedioFinal) > 0);
    const suma = validGrades.reduce((acc, curr) => acc + Number(curr.promedioFinal), 0);
    const promedioGeneral = validGrades.length > 0 ? (suma / validGrades.length) : 0;

    const asistencias = await this.attendanceRepo.find({
      where: { enrollment: { student: { user: { id: userId } } } },
    });
    const total = asistencias.length;
    const faltas = asistencias.filter(a => a.estado === AttendanceStatus.FALTA).length;
    const asistenciaPorcentaje = total > 0 ? Math.round(((total - faltas) / total) * 100) : 100;

    const mensajes = await this.msgRepo.find({
      where: { destinatario: { id: userId } },
      order: { fechaEnvio: 'DESC' }, take: 5,
    });

    return {
      promedioGeneral: Number(promedioGeneral.toFixed(1)),
      asistenciaPorcentaje,
      notificaciones: mensajes.map(msg => ({
        id: msg.id, asunto: msg.asunto, cuerpoMensaje: msg.cuerpoMensaje,
        fechaEnvio: msg.fechaEnvio, leido: msg.leido
      }))
    };
  }

  async getStudentAttendance(userId: string) {
    const asistencias = await this.attendanceRepo.find({
      where: { enrollment: { student: { user: { id: userId } } } },
      relations: ['course', 'course.subject'],
      order: { fecha: 'DESC' },
    });
    const faltas = asistencias.filter((a) => a.estado === AttendanceStatus.FALTA).length;
    const retardos = asistencias.filter((a) => a.estado === AttendanceStatus.RETARDO).length;
    const total = asistencias.length;
    const porcentaje = total > 0 ? Math.round(((total - faltas) / total) * 100) : 100;

    return {
      estadisticas: { asistencia: porcentaje, faltas, retardos },
      fechas: asistencias
        .filter((a) => a.estado !== AttendanceStatus.ASISTENCIA)
        .map((a) => ({
          id: a.id, fecha: new Date(a.fecha).toISOString().split('T')[0],
          materia: a.course?.subject?.nombre || 'Materia Desconocida',
          tipo: a.estado === AttendanceStatus.FALTA ? 'Falta' : 'Retardo',
        })),
      recordatorios: ['Mantén tu asistencia arriba del 80%.'],
    };
  }

  async getAcademicHistory(studentId: string) {
    const grades = await this.gradeRepo.find({
      where: { enrollment: { student: { user: { id: studentId } } } },
      relations: ['course', 'course.subject', 'course.group', 'course.group.period'],
      order: { course: { group: { period: { fechaInicio: 'ASC' } } } }
    });

    const materiasCursadas = grades.filter(g => Number(g.promedioFinal) > 0);
    const sumaPuntos = materiasCursadas.reduce((acc, g) => acc + (Number(g.promedioFinal) * (g.course?.subject?.creditos || 1)), 0);
    const totalCreditos = materiasCursadas.reduce((acc, g) => acc + (g.course?.subject?.creditos || 1), 0);

    return {
      promedioGeneral: totalCreditos > 0 ? Number((sumaPuntos / totalCreditos).toFixed(1)) : 0,
      asignaturasAprobadas: materiasCursadas.filter(g => Number(g.promedioFinal) >= 70).length,
      calificacionesDetalle: materiasCursadas.map(b => ({
        asignatura: b.course?.subject?.nombre || 'Materia Desconocida',
        promedio: Number(b.promedioFinal),
        periodo: b.course?.group?.period?.nombre || 'Indefinido'
      })).reverse()
    };
  }

  async getStudentGradesByPeriod(userId: string, periodoNombre: string) {
    const grades = await this.gradeRepo.find({
      where: {
        enrollment: { student: { user: { id: userId } } },
        course: { group: { period: { nombre: periodoNombre } } },
      },
      relations: ['course', 'course.subject'],
    });

    return grades.map((g) => ({
      materia: g.course?.subject?.nombre || 'Desconocida',
      u1: Number(g.parcial1 || 0).toFixed(1),
      u2: Number(g.parcial2 || 0).toFixed(1),
      u3: Number(g.parcial3 || 0).toFixed(1),
      final: Number(g.promedioFinal || 0).toFixed(1),
    }));
  }

  async getInbox(userId: string) {
    return await this.msgRepo.find({
      where: { destinatario: { id: userId } },
      relations: ['remitente'], order: { fechaEnvio: 'DESC' }, take: 50,
    });
  }

  async getSent(userId: string) {
    return await this.msgRepo.find({
      where: { remitente: { id: userId } },
      relations: ['destinatario'], order: { fechaEnvio: 'DESC' }, take: 50,
    });
  }

  async sendMessage(senderId: string, destEmail: string, subject: string, body: string) {
    const receiver = await this.userRepo.findOne({ where: { email: destEmail }, select: ['id'] });
    if (!receiver) throw new NotFoundException('Usuario destinatario no encontrado');

    const msg = this.msgRepo.create({
      asunto: subject, cuerpoMensaje: body,
      remitente: { id: senderId }, destinatario: { id: receiver.id }, leido: false,
    });
    return await this.msgRepo.save(msg);
  }

  async markMessageRead(msgId: string) {
    return await this.msgRepo.update(msgId, { leido: true });
  }

  async getStudentPeriods(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { student: { user: { id: userId } } },
      relations: ['group', 'group.period'],
      order: { group: { period: { fechaInicio: 'DESC' } } }
    });
    return [...new Set(enrollments.map(e => e.group?.period?.nombre))].filter(Boolean);
  }

  // Stubs para compatibilidad de Controller
  async getTeacherLoad(id: string) { return []; }
  async getTeacherGroups(id: string) { return []; }
  async getStudentsForGrading(id: string) { return []; }
  async saveGrades(id: string, d: any) { return { success: true }; }
  async getTeacherStats(id: string) { return { promedioFinalGrupo: 0 }; }
}