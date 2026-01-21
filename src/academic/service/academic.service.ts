/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { TeacherProfile } from '../../teacher/entities/teacher-profile.entity';
import { Course } from '../entities/course.entity';
import { GradeCard } from '../entities/grade-card.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Group } from '../entities/group.entity';
import { AttendanceDetail } from '../entities/attendance-detail.entity';
import { AttendanceStatus } from '../../shared/enums/attendance-status.enum';
import { InternalMessage } from '../../communications/entities/internal-message.entity';
import { User } from '../../users/entities/user.entity';

export interface GradeInput {
  id: string;
  parcial1: string | number;
  parcial2: string | number;
  parcial3: string | number;
  final: string | number;
  extraordinario?: string | number | null;
}

export interface UpdateProfileDto {
  tituloAcademico?: string;
  especialidad?: string;
  habilidades?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  claveEmpleado?: string;
}

interface LocalAttendanceDto {
  grupoId: string;
  fecha: string;
  asistencias: { studentId: string; status: string }[];
}

@Injectable()
export class AcademicService {
  constructor(
    @InjectRepository(TeacherProfile)
    private readonly teacherRepo: Repository<TeacherProfile>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(GradeCard)
    private readonly gradeRepo: Repository<GradeCard>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(AttendanceDetail)
    private readonly attendanceRepo: Repository<AttendanceDetail>,
    @InjectRepository(InternalMessage)
    private readonly msgRepo: Repository<InternalMessage>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getStudentCourses(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { student: { user: { id: userId } } },
      relations: ['group'],
    });
    if (!enrollments.length) return [];
    const groupIds = enrollments.map((e) => e.group.id);
    const courses = await this.courseRepo.find({
      where: { group: { id: In(groupIds) } },
      relations: ['subject', 'teacher', 'teacher.user', 'schedules'],
    });
    return courses.map((c) => ({
      id: c.id,
      materia: c.subject?.nombre || 'Sin Nombre',
      profesor: c.teacher?.user?.fullName || 'Por asignar',
      horarios: c.schedules.map((s) => ({
        dia: s.diaSemana,
        hora: `${s.horaInicio.toString().slice(0, 5)} - ${s.horaFin.toString().slice(0, 5)}`,
      })),
    }));
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
      u1: g.parcial1?.toString() || '---',
      u2: g.parcial2?.toString() || '---',
      u3: g.parcial3?.toString() || '---',
      u4: '---',
      u5: '---',
      final: g.promedioFinal?.toString() || '---',
    }));
  }

  async getAcademicHistory(studentId: string) {
    return await this.gradeRepo.find({
      where: { enrollment: { student: { user: { id: studentId } } } },
      relations: ['course', 'course.subject'],
      order: { course: { id: 'ASC' } },
    });
  }

  async getStudentAttendance(userId: string) {
    const asistencias = await this.attendanceRepo.find({
      where: { enrollment: { student: { user: { id: userId } } } },
      relations: ['course', 'course.subject'],
      order: { fecha: 'DESC' },
    });
    const faltas = asistencias.filter(
      (a) => a.estado === AttendanceStatus.FALTA,
    ).length;
    const retardos = asistencias.filter(
      (a) => a.estado === AttendanceStatus.RETARDO,
    ).length;
    const total = asistencias.length;
    const porcentaje =
      total > 0 ? Math.round(((total - faltas) / total) * 100) : 100;
    return {
      estadisticas: {
        asistencia: porcentaje,
        faltas: faltas,
        retardos: retardos,
      },
      fechas: asistencias
        .filter((a) => a.estado !== AttendanceStatus.ASISTENCIA)
        .map((a) => ({
          id: a.id,
          fecha: new Date(a.fecha).toISOString().split('T')[0],
          materia: a.course?.subject?.nombre || 'Materia Desconocida',
          tipo: a.estado === AttendanceStatus.FALTA ? 'Falta' : 'Retardo',
        })),
      recordatorios: [
        'Recuerda justificar tus faltas en Servicios Escolares.',
        'Mantén tu asistencia arriba del 80%.',
      ],
    };
  }

  async getTeacherLoad(teacherId: string) {
    return await this.courseRepo.find({
      where: { teacher: { user: { id: teacherId } } },
      relations: ['subject', 'group', 'schedules'],
      order: { id: 'DESC' },
    });
  }

  async getTeacherGroups(teacherId: string): Promise<any[]> {
    const courses = await this.courseRepo.find({
      where: { teacher: { user: { id: teacherId } } },
      relations: ['group'],
    });
    const uniqueGroups = new Map<string, any>();
    courses.forEach((c) => {
      if (c.group) {
        uniqueGroups.set(c.group.id, {
          id: c.group.id,
          nombre: c.group.nombre,
        });
      }
    });
    return Array.from(uniqueGroups.values());
  }

  async getStudentsForGrading(courseId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['group', 'subject'],
    });
    if (!course || !course.group) return [];
    const enrollments = await this.enrollmentRepo.find({
      where: { group: { id: course.group.id } },
      relations: ['student', 'student.user'],
      order: { student: { user: { fullName: 'ASC' } } },
    });
    const results: any[] = [];
    for (const enrollment of enrollments) {
      let gradeCard = await this.gradeRepo.findOne({
        where: {
          enrollment: { id: enrollment.id },
          course: { id: courseId },
        },
      });
      if (!gradeCard) {
        gradeCard = this.gradeRepo.create({
          course: { id: courseId } as Course,
          enrollment,
          parcial1: 0,
          parcial2: 0,
          parcial3: 0,
          promedioFinal: 0,
          porcentajeAsistenciaGlobal: 0,
        });
        await this.gradeRepo.save(gradeCard);
      }
      const historial = await this.attendanceRepo.find({
        where: {
          enrollment: { id: enrollment.id },
          course: { id: courseId },
        },
      });
      let pct = 0;
      if (historial.length > 0) {
        const pres = historial.filter(
          (a) =>
            a.estado === AttendanceStatus.ASISTENCIA ||
            a.estado === AttendanceStatus.RETARDO,
        ).length;
        pct = Math.round((pres / historial.length) * 100);
      }

      const fmt = (val: any) =>
        isNaN(Number(val)) ? '0' : Math.floor(Number(val)).toString();

      results.push({
        id: gradeCard.id,
        nombre: enrollment.student?.user?.fullName || 'S/N',
        matricula: enrollment.student?.matricula || 'S/M',
        parcial1: fmt(gradeCard.parcial1),
        parcial2: fmt(gradeCard.parcial2),
        parcial3: fmt(gradeCard.parcial3),
        final: fmt(gradeCard.promedioFinal),
        extraordinario: isNaN(Number(gradeCard.extraordinario))
          ? ''
          : String(gradeCard.extraordinario || ''),
        porcentaje_asistencia_global: pct,
      });
    }
    return results;
  }

  async saveGrades(_courseId: string, gradesData: GradeInput[]) {
    const promises = gradesData.map(async (item) => {
      const p1 =
        item.parcial1 === 'NA' || isNaN(Number(item.parcial1))
          ? 0
          : Number(item.parcial1);
      const p2 =
        item.parcial2 === 'NA' || isNaN(Number(item.parcial2))
          ? 0
          : Number(item.parcial2);
      const p3 =
        item.parcial3 === 'NA' || isNaN(Number(item.parcial3))
          ? 0
          : Number(item.parcial3);
      const fin =
        item.final === 'NA' || isNaN(Number(item.final)) ? 0 : Number(item.final);
      return await this.gradeRepo.update(item.id, {
        parcial1: Math.min(Math.max(0, p1), 100),
        parcial2: Math.min(Math.max(0, p2), 100),
        parcial3: Math.min(Math.max(0, p3), 100),
        promedioFinal: Math.min(Math.max(0, fin), 100),
        extraordinario: null,
      });
    });
    await Promise.all(promises);
    return { success: true };
  }

  async getStudentsForAttendance(groupId: string) {
    return await this.enrollmentRepo.find({
      where: { group: { id: groupId } },
      relations: ['student', 'student.user'],
      order: { student: { user: { fullName: 'ASC' } } },
    });
  }

  async saveAttendanceBatch(data: any) {
    const dto: LocalAttendanceDto = data;
    const course = await this.courseRepo.findOne({
      where: { group: { id: dto.grupoId } },
      select: ['id'],
    });
    if (!course) throw new NotFoundException('No encontrado');
    const registros = dto.asistencias.map((item) =>
      this.attendanceRepo.create({
        fecha: new Date(dto.fecha),
        estado: item.status as AttendanceStatus,
        enrollment: { id: item.studentId } as Enrollment,
        course: { id: course.id } as Course,
      }),
    );
    await this.attendanceRepo.save(registros);
    return { success: true, count: registros.length };
  }

  async getProfile(userId: string) {
    return await this.teacherRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async updateProfile(userId: string, data: any) {
    const result = await this.teacherRepo.update({ user: { id: userId } }, data);
    if (result.affected === 0) throw new NotFoundException('No encontrado');
    return { success: true };
  }

  async getInbox(userId: string) {
    return await this.msgRepo.find({
      where: { destinatario: { id: userId } },
      relations: ['remitente'],
      select: {
        id: true,
        asunto: true,
        cuerpoMensaje: true,
        fechaEnvio: true,
        leido: true,
        remitente: { id: true, email: true, fullName: true },
      },
      order: { fechaEnvio: 'DESC' },
      take: 50,
    });
  }

  async getSent(userId: string) {
    return await this.msgRepo.find({
      where: { remitente: { id: userId } },
      relations: ['destinatario'],
      select: {
        id: true,
        asunto: true,
        cuerpoMensaje: true,
        fechaEnvio: true,
        leido: true,
        destinatario: { id: true, email: true, fullName: true },
      },
      order: { fechaEnvio: 'DESC' },
      take: 50,
    });
  }

  async sendMessage(
    senderId: string,
    destEmail: string,
    subject: string,
    body: string,
  ) {
    const receiver = await this.userRepo.findOne({
      where: { email: destEmail },
      select: ['id'],
    });
    if (!receiver) throw new NotFoundException('No encontrado');
    const msg = this.msgRepo.create({
      asunto: subject,
      cuerpoMensaje: body,
      remitente: { id: senderId },
      destinatario: { id: receiver.id },
      leido: false,
    });
    return await this.msgRepo.save(msg);
  }

  async markMessageRead(msgId: string) {
    return await this.msgRepo.update(msgId, { leido: true });
  }

  async getStudentDashboardSummary(_studentId: string) {
    return await Promise.resolve({
      message: 'Dashboard summary not implemented yet',
    });
  }

  async getStudentProfile(userId: string) {
    return await this.userRepo.findOne({ where: { id: userId } });
  }

  async getTeacherStats(userId: string) {
    const courses = await this.courseRepo.find({
      where: { teacher: { user: { id: userId } } },
      relations: [
        'gradeCards',
        'gradeCards.enrollment',
        'gradeCards.enrollment.student',
        'subject',
        'group',
      ],
    });
    if (courses.length === 0) return this.getEmptyStats();

    const boletasTotales = courses.flatMap((c) => c.gradeCards || []);
    const studentIds = new Set(
      boletasTotales.map((b) => b.enrollment?.student?.id).filter((id) => !!id),
    );

    const safeN = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

    const promedioGral =
      boletasTotales.length > 0
        ? boletasTotales.reduce((acc, b) => acc + safeN(b.promedioFinal), 0) /
          boletasTotales.length
        : 0;

    const aprobados = boletasTotales.filter(
      (b) => safeN(b.promedioFinal) >= 70,
    ).length;

    const rendimientoMateria = courses.map((c) => {
      const bMateria = c.gradeCards || [];
      const suma = bMateria.reduce(
        (acc, b) => acc + safeN(b.promedioFinal),
        0,
      );
      return {
        materia: c.subject?.nombre || 'S/N',
        promedio:
          bMateria.length > 0 ? Number((suma / bMateria.length).toFixed(1)) : 0,
      };
    });

    const asistencias = await this.attendanceRepo.find({
      where: { course: { id: In(courses.map((c) => c.id)) } },
      relations: ['enrollment', 'enrollment.student'],
    });

    let asistGral = 0;
    let asistCritica = 0;
    if (asistencias.length > 0) {
      const presentes = asistencias.filter(
        (a) =>
          a.estado === AttendanceStatus.ASISTENCIA ||
          a.estado === AttendanceStatus.RETARDO,
      ).length;
      asistGral = Math.round((presentes / asistencias.length) * 100);

      const mapAsist = new Map<string, { total: number; pres: number }>();
      asistencias.forEach((a) => {
        const id = a.enrollment?.student?.id;
        if (!id) return;
        const curr = mapAsist.get(id) || { total: 0, pres: 0 };
        curr.total++;
        if (
          a.estado === AttendanceStatus.ASISTENCIA ||
          a.estado === AttendanceStatus.RETARDO
        )
          curr.pres++;
        mapAsist.set(id, curr);
      });
      mapAsist.forEach((v) => {
        if ((v.pres / v.total) * 100 < 80) asistCritica++;
      });
    }

    return {
      promedioFinalGrupo: Number(promedioGral.toFixed(1)),
      asistenciaPromedio: asistGral,
      tasaAprobacion:
        boletasTotales.length > 0
          ? Number(((aprobados / boletasTotales.length) * 100).toFixed(0))
          : 0,
      rendimientoMateria,
      totalEstudiantes: studentIds.size,
      estudiantesBajoRendimiento: boletasTotales.length - aprobados,
      materiasImpartidas: courses.length,
      gruposAsignados: new Set(courses.map((c) => c.group?.id)).size,
      estudiantesAsistenciaCritica: asistCritica,
    };
  }

  private getEmptyStats() {
    return {
      promedioFinalGrupo: 0,
      asistenciaPromedio: 0,
      tasaAprobacion: 0,
      rendimientoMateria: [],
      totalEstudiantes: 0,
      estudiantesBajoRendimiento: 0,
      materiasImpartidas: 0,
      gruposAsignados: 0,
      estudiantesAsistenciaCritica: 0,
    };
  }
}