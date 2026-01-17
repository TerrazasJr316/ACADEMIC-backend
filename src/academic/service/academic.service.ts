import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

// Entidades
import { TeacherProfile } from '../../teacher/entities/teacher-profile.entity';
import { Course } from '../entities/course.entity';
import { GradeCard } from '../entities/grade-card.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Group } from '../entities/group.entity';
import { AttendanceDetail } from '../entities/attendance-detail.entity';
import { AttendanceStatus } from '../../shared/enums/attendance-status.enum';
import { InternalMessage } from '../../communications/entities/internal-message.entity';
import { User } from '../../users/entities/user.entity';

type RendimientoMateria = { materia: string; promedio: number };

// Interfaz para los datos de entrada de calificaciones
export interface GradeInput {
  id: string;
  parcial1: string | number;
  parcial2: string | number;
  parcial3: string | number;
  final: string | number;
  extraordinario?: string | number | null;
}

// Interfaz para evitar 'any' en updateProfile
export interface UpdateProfileDto {
  tituloAcademico?: string;
  especialidad?: string;
  habilidades?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  claveEmpleado?: string;
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

  // ==========================================
  // 🎓 SECCIÓN 1: ACADÉMICA (Grupos, Notas)
  // ==========================================

  async getTeacherLoad(teacherId: string) {
    return this.courseRepo.find({
      where: { teacher: { user: { id: teacherId } } },
      relations: ['subject', 'group', 'schedules'],
    });
  }

  async getTeacherGroups(teacherId: string) {
    const courses = await this.courseRepo.find({
      where: { teacher: { user: { id: teacherId } } },
      relations: ['group'],
    });
    const uniqueGroups = new Map<string, Group>();
    courses.forEach((c) => {
      if (c.group) uniqueGroups.set(c.group.id, c.group);
    });
    return Array.from(uniqueGroups.values());
  }

  async getStudentsForGrading(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso no encontrado');

    const grades = await this.gradeRepo.find({
      where: { course: { id: courseId } },
      relations: [
        'enrollment',
        'enrollment.student',
        'enrollment.student.user',
      ],
    });

    return grades.map((g) => ({
      id: g.id,
      nombre: g.enrollment?.student?.user?.fullName || 'Alumno Sin Nombre',
      matricula: g.enrollment?.student?.matricula || 'S/M',
      parcial1: g.parcial1?.toString() ?? '',
      parcial2: g.parcial2?.toString() ?? '',
      parcial3: g.parcial3?.toString() ?? '',
      final: g.promedioFinal?.toString() ?? '',
      extraordinario: g.extraordinario?.toString() ?? '',
    }));
  }

  async saveGrades(courseId: string, gradesData: GradeInput[]) {
    const savedGrades: GradeCard[] = [];
    for (const item of gradesData) {
      const gradeCard = await this.gradeRepo.findOne({
        where: { id: item.id },
      });
      if (!gradeCard) continue;

      gradeCard.parcial1 = Number(item.parcial1 || 0);
      gradeCard.parcial2 = Number(item.parcial2 || 0);
      gradeCard.parcial3 = Number(item.parcial3 || 0);
      gradeCard.promedioFinal = Number(item.final || 0);
      gradeCard.extraordinario =
        item.extraordinario && item.extraordinario !== 'NA'
          ? Number(item.extraordinario)
          : null;

      savedGrades.push(await this.gradeRepo.save(gradeCard));
    }
    return { message: 'Calificaciones guardadas', count: savedGrades.length };
  }

  // ==========================================
  // 📝 SECCIÓN 2: ASISTENCIA (Pantalla Asistencia)
  // ==========================================

  async getStudentsForAttendance(groupId: string) {
    return this.enrollmentRepo.find({
      where: { group: { id: groupId } },
      relations: ['student', 'student.user'],
    });
  }

  async saveAttendanceBatch(data: {
    grupoId: string;
    fecha: string;
    asistencias: { studentId: string; status: string }[];
  }) {
    const registros: AttendanceDetail[] = [];

    const course = await this.courseRepo.findOne({
      where: { group: { id: data.grupoId } },
    });

    if (!course) {
      throw new NotFoundException(
        `No se encontró un curso activo para el grupo ${data.grupoId}`,
      );
    }

    for (const item of data.asistencias) {
      const registro = this.attendanceRepo.create({
        fecha: new Date(data.fecha),
        estado: item.status as AttendanceStatus,
        enrollment: { id: item.studentId } as Enrollment,
        course: course,
      });
      registros.push(registro);
    }

    await this.attendanceRepo.save(registros);
    return { success: true, count: registros.length };
  }

  // ==========================================
  // 👤 SECCIÓN 3: PERFIL (Pantalla Perfil)
  // ==========================================

  async getProfile(userId: string) {
    return this.teacherRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const profile = await this.teacherRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    if (data.tituloAcademico !== undefined)
      profile.tituloAcademico = data.tituloAcademico;
    if (data.especialidad !== undefined)
      profile.especialidad = data.especialidad;
    if (data.habilidades !== undefined) profile.habilidades = data.habilidades;
    if (data.telefono !== undefined) profile.telefono = data.telefono;
    if (data.ciudad !== undefined) profile.ciudad = data.ciudad;
    if (data.direccion !== undefined) profile.direccion = data.direccion;
    if (data.claveEmpleado !== undefined)
      profile.claveEmpleado = data.claveEmpleado;

    return this.teacherRepo.save(profile);
  }

  // ==========================================
  // 📨 SECCIÓN 4: MENSAJES (Pantalla Mensajes)
  // ==========================================

  async getInbox(userId: string) {
    return this.msgRepo.find({
      where: { destinatario: { id: userId } },
      relations: ['remitente'],
      order: { fechaEnvio: 'DESC' },
    });
  }

  async getSent(userId: string) {
    return this.msgRepo.find({
      where: { remitente: { id: userId } },
      relations: ['destinatario'],
      order: { fechaEnvio: 'DESC' },
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
    });
    if (!receiver) throw new NotFoundException('Destinatario no encontrado');

    const msg = this.msgRepo.create({
      asunto: subject,
      cuerpoMensaje: body,
      remitente: { id: senderId },
      destinatario: { id: receiver.id },
      leido: false,
    });
    return this.msgRepo.save(msg);
  }

  async markMessageRead(msgId: string) {
    return this.msgRepo.update(msgId, { leido: true });
  }

  // ==========================================
  // 📊 SECCIÓN 5: ESTADÍSTICAS
  // ==========================================

  async getTeacherStats(userId: string) {
    const courses = await this.courseRepo.find({
      where: { teacher: { user: { id: userId } } },
      relations: ['gradeCards', 'subject'],
    });

    if (courses.length === 0) return this.getEmptyStats();

    const courseIds = courses.map((c) => c.id);
    let totalAlumnos = 0,
      sumaPromedios = 0,
      aprobados = 0;
    const rendimientoMateria: RendimientoMateria[] = [];

    for (const course of courses) {
      const boletas = course.gradeCards ?? [];
      totalAlumnos += boletas.length;
      let promMateria = 0;

      if (boletas.length > 0) {
        const suma = boletas.reduce(
          (acc, b) => acc + Number(b.promedioFinal ?? 0),
          0,
        );
        promMateria = suma / boletas.length;
        aprobados += boletas.filter(
          (b) => Number(b.promedioFinal ?? 0) >= 70,
        ).length;
      }
      rendimientoMateria.push({
        materia: course.subject?.nombre ?? 'Sin Asignar',
        promedio: Number(promMateria.toFixed(1)),
      });
      sumaPromedios += promMateria;
    }

    let asistenciaPromedio = 0,
      estudiantesAsistenciaCritica = 0;
    const asistencias = await this.attendanceRepo.find({
      where: { course: { id: In(courseIds) } },
      relations: ['enrollment'],
    });

    if (asistencias.length > 0) {
      const presentes = asistencias.filter(
        (a) =>
          a.estado === AttendanceStatus.ASISTENCIA ||
          a.estado === AttendanceStatus.RETARDO,
      ).length;
      asistenciaPromedio = (presentes / asistencias.length) * 100;

      const asistenciaPorAlumno = new Map<
        string,
        { total: number; presentes: number }
      >();
      asistencias.forEach((a) => {
        const enrollmentId = a.enrollment ? a.enrollment.id : 'unknown';
        if (!asistenciaPorAlumno.has(enrollmentId))
          asistenciaPorAlumno.set(enrollmentId, { total: 0, presentes: 0 });
        const curr = asistenciaPorAlumno.get(enrollmentId)!;
        curr.total++;
        if (
          a.estado === AttendanceStatus.ASISTENCIA ||
          a.estado === AttendanceStatus.RETARDO
        )
          curr.presentes++;
      });

      asistenciaPorAlumno.forEach((val) => {
        if ((val.presentes / val.total) * 100 < 80)
          estudiantesAsistenciaCritica++;
      });
    }

    const promedioGlobal =
      courses.length > 0 ? sumaPromedios / courses.length : 0;
    const tasaAprobacion =
      totalAlumnos > 0 ? (aprobados / totalAlumnos) * 100 : 0;

    return {
      promedioFinalGrupo: Number(promedioGlobal.toFixed(1)),
      asistenciaPromedio: Number(asistenciaPromedio.toFixed(1)),
      tasaAprobacion: Number(tasaAprobacion.toFixed(1)),
      rendimientoMateria,
      totalEstudiantes: totalAlumnos,
      estudiantesBajoRendimiento: totalAlumnos - aprobados,
      materiasImpartidas: courses.length,
      gruposAsignados: courses.length,
      estudiantesAsistenciaCritica,
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
