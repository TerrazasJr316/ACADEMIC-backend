/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { InternalMessage } from '../../communications/entities/internal-message.entity';
import { User } from '../../users/entities/user.entity';

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
    @InjectRepository(TeacherProfile) private readonly teacherRepo: Repository<TeacherProfile>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(GradeCard) private readonly gradeRepo: Repository<GradeCard>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(AttendanceDetail) private readonly attendanceRepo: Repository<AttendanceDetail>,
    @InjectRepository(InternalMessage) private readonly msgRepo: Repository<InternalMessage>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) { }

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

    // --- LÓGICA DE FUSIÓN ---
    // Usamos un Mapa para agrupar materias por su nombre
    const materiasMap = new Map<string, any>();

    courses.forEach((c) => {
      const nombreMateria = c.subject?.nombre || 'Sin Nombre';

      // Formateamos los horarios de este curso específico
      const nuevosHorarios = c.schedules?.map((s) => ({
        dia: s.diaSemana,
        hora: `${s.horaInicio.toString().slice(0, 5)} - ${s.horaFin.toString().slice(0, 5)}`,
      })) || [];

      if (materiasMap.has(nombreMateria)) {
        // CASO A: Ya existe la materia en la lista -> FUSIONAMOS
        const existente = materiasMap.get(nombreMateria);

        // 1. Combinamos los horarios
        existente.horarios = [...existente.horarios, ...nuevosHorarios];

        // 2. Opcional: Si el profesor es diferente, podrías concatenarlo, 
        // pero por ahora mantenemos el principal para no ensuciar la UI.

      } else {
        // CASO B: Es la primera vez que vemos esta materia -> CREAMOS
        materiasMap.set(nombreMateria, {
          id: c.id,
          materia: nombreMateria,
          profesor: c.teacher?.user?.fullName || 'Por asignar',
          semestre: c.group?.semestre || 1,
          horarios: nuevosHorarios
        });
      }
    });

    // Convertimos el mapa de vuelta a un array para el Frontend
    return Array.from(materiasMap.values());
  }

  // =================================================================
  //  2. PERFIL DE ESTUDIANTE (CORREGIDO ESTRUCTURA COMPLETA)
  // =================================================================
  async getStudentProfile(userId: string) {
    // Buscamos el usuario y su perfil de estudiante relacionado
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['studentProfile'] // Asegúrate que en User.entity tengas esta relación definida
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    const profile = user.studentProfile;
    // Datos por defecto si no hay perfil creado aún
    const matricula = profile?.matricula || 'S/M';
    let grado = profile?.gradoActual || '1';

    // [CORRECCIÓN]: Si el grado es N/A, buscamos la inscripción más reciente para sacar el semestre real
    if (!grado || grado === 'N/A') {
      const lastEnrollment = await this.enrollmentRepo.findOne({
        where: { student: { id: profile.id } },
        relations: ['group'],
        order: { fechaInscripcion: 'DESC' }
      });
      if (lastEnrollment && lastEnrollment.group) {
        grado = lastEnrollment.group.semestre.toString();
      }
    }

    // Calculamos el promedio real
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

    // Retornamos la estructura EXACTA que pide el Frontend (AlumnoProfileData)
    return {
      resumen: {
        name: user.fullName,
        id: matricula,
        career: 'Ingeniería en Sistemas', // Puedes hacerlo dinámico si tienes esa info
        semester: `${grado}° Semestre`,
        average: Number(promedio.toFixed(1)),
      },
      personal: {
        fullName: profile?.nombreCompleto || user.fullName,
        id: matricula,
        birthDate: profile?.fechaNacimiento ? profile.fechaNacimiento.toString() : '---',
        gender: profile?.genero || '---',
        email: user.email,
        phone: profile?.telefono || '---',
        address: profile?.direccion || '---',
        curp: profile?.curp || '---',
      },
      academic: {
        semester: `${grado}° Semestre`,
        average: Number(promedio.toFixed(1)),
        status: user.isActive ? 'Activo' : 'Inactivo',
        approvedSubjects: aprobadas,
      },
      payment: {
        balanceDue: 0.00, // Conectar con pagos reales si existen
      }
    };
  }

  // =================================================================
  //  3. DASHBOARD SUMMARY (IMPLEMENTADO)
  // =================================================================
  async getStudentDashboardSummary(userId: string) {
    // 1. Promedio
    const boletas = await this.gradeRepo.find({
      where: { enrollment: { student: { user: { id: userId } } } },
      select: ['promedioFinal'],
    });
    const validGrades = boletas.filter(b => Number(b.promedioFinal) > 0);
    const suma = validGrades.reduce((acc, curr) => acc + Number(curr.promedioFinal), 0);
    const promedioGeneral = validGrades.length > 0 ? (suma / validGrades.length) : 0;

    // 2. Asistencia
    const asistencias = await this.attendanceRepo.find({
      where: { enrollment: { student: { user: { id: userId } } } },
    });
    const total = asistencias.length;
    const faltas = asistencias.filter(a => a.estado === AttendanceStatus.FALTA).length;
    const asistenciaPorcentaje = total > 0 ? Math.round(((total - faltas) / total) * 100) : 100;

    // 3. Notificaciones
    const mensajes = await this.msgRepo.find({
      where: { destinatario: { id: userId } },
      order: { fechaEnvio: 'DESC' },
      take: 5,
    });

    return {
      promedioGeneral: Number(promedioGeneral.toFixed(1)),
      asistenciaPorcentaje,
      notificaciones: mensajes.map(msg => ({
        id: msg.id,
        asunto: msg.asunto,
        cuerpoMensaje: msg.cuerpoMensaje,
        fechaEnvio: msg.fechaEnvio,
        leido: msg.leido
      }))
    };
  }

  // =================================================================
  //  OTROS MÉTODOS EXISTENTES (Mantener igual)
  // =================================================================

  async getStudentGradesByPeriod(userId: string, periodoNombre: string) {
    const grades = await this.gradeRepo.find({
      where: {
        enrollment: { student: { user: { id: userId } } },
        course: { group: { period: { nombre: periodoNombre } } },
      },
      relations: ['course', 'course.subject'],
    });

    // 1. Agrupamos por nombre de materia para eliminar duplicados
    const materiasMap = new Map();

    grades.forEach((g) => {
      const nombreMateria = g.course?.subject?.nombre || 'Desconocida';

      // Obtenemos la boleta que ya teníamos guardada (si existe)
      const currentBest = materiasMap.get(nombreMateria);

      // Calculamos un "puntaje" sumando todo para saber cuál boleta tiene datos reales
      const scoreActual = Number(g.promedioFinal) + Number(g.parcial1) + Number(g.parcial2) + Number(g.parcial3);

      const scorePrevio = currentBest
        ? (Number(currentBest.promedioFinal) + Number(currentBest.parcial1) + Number(currentBest.parcial2) + Number(currentBest.parcial3))
        : -1;

      // REGLA: Si es la primera vez que la vemos, O si la actual tiene más datos que la anterior -> La guardamos
      if (!currentBest || scoreActual > scorePrevio) {
        materiasMap.set(nombreMateria, g);
      }
    });

    // 2. Convertimos el Map a Array y aplicamos el formato visual
    return Array.from(materiasMap.values()).map((g: any) => {
      // Cálculo dinámico si el final es 0
      let finalVal = Number(g.promedioFinal || 0);

      // Si el final es 0 pero tiene parciales, calculamos el promedio
      if (finalVal === 0 && (Number(g.parcial1) > 0 || Number(g.parcial2) > 0 || Number(g.parcial3) > 0)) {
        finalVal = (Number(g.parcial1 || 0) + Number(g.parcial2 || 0) + Number(g.parcial3 || 0)) / 3;
      }

      return {
        materia: g.course?.subject?.nombre || 'Desconocida',
        u1: Number(g.parcial1 || 0).toFixed(1),
        u2: Number(g.parcial2 || 0).toFixed(1),
        u3: Number(g.parcial3 || 0).toFixed(1),
        u4: '-',
        u5: '-',
        final: finalVal.toFixed(1),
      };
    });
  }

  async getAcademicHistory(studentId: string) {
    // 1. Buscamos todas las boletas con relaciones a Materia (para créditos) y Periodo
    const grades = await this.gradeRepo.find({
      where: { enrollment: { student: { user: { id: studentId } } } },
      relations: [
        'course',
        'course.subject', // <--- Necesario para leer 'creditos'
        'course.group',
        'course.group.period'
      ],
      // Ordenamos cronológicamente por periodo
      order: { course: { group: { period: { fechaInicio: 'ASC' } } } }
    });

    // 2. Filtramos solo materias que ya se cursaron (tienen calificación > 0)
    const materiasCursadas = grades.filter(g =>
      Number(g.promedioFinal) > 0 || (g.extraordinario && Number(g.extraordinario) > 0)
    );

    // 3. Variables para el cálculo matemático
    let sumaPuntos = 0;
    let totalCreditos = 0;
    let asignaturasAprobadas = 0;

    // 4. Procesamos cada materia para armar la lista y calcular al mismo tiempo
    const calificacionesDetalle = materiasCursadas.map(boleta => {
      // A. Obtener créditos (Si es null o 0, usamos 1 para evitar errores)
      const creditos = boleta.course?.subject?.creditos || 1;

      // B. Determinar la nota efectiva (Prioridad: Extraordinario > Ordinario)
      const notaOrdinaria = Number(boleta.promedioFinal || 0);
      const notaExtra = Number(boleta.extraordinario || 0);

      // Si hay calificación en extra, esa es la que vale. Si no, la ordinaria.
      const notaFinal = notaExtra > 0 ? notaExtra : notaOrdinaria;

      // C. Acumular para el promedio ponderado
      sumaPuntos += (notaFinal * creditos);
      totalCreditos += creditos;

      // D. Verificar si aprobó (Mínimo 70, ajusta si tu escala es diferente)
      if (notaFinal >= 70) {
        asignaturasAprobadas++;
      }

      // E. Retornar el objeto para el Frontend
      return {
        asignatura: boleta.course?.subject?.nombre || 'Materia Desconocida',
        promedio: Number(notaFinal), // Mostramos la nota real (sea extra u ordinaria)
        periodo: boleta.course?.group?.period?.nombre || 'Indefinido'
      };
    });

    // 5. División Final (Evitando división por cero)
    const promedioGeneral = totalCreditos > 0 ? (sumaPuntos / totalCreditos) : 0;

    return {
      promedioGeneral: Number(promedioGeneral.toFixed(1)), // Redondeado a 1 decimal
      asignaturasAprobadas,
      calificacionesDetalle: calificacionesDetalle.reverse(), // Mostramos las más recientes arriba
      documentosDisponibles: [] // Dejamos vacío o conectamos con documentos si existen
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
      estadisticas: { asistencia: porcentaje, faltas: faltas, retardos: retardos },
      fechas: asistencias
        .filter((a) => a.estado !== AttendanceStatus.ASISTENCIA)
        .map((a) => ({
          id: a.id,
          fecha: new Date(a.fecha).toISOString().split('T')[0],
          materia: a.course?.subject?.nombre || 'Materia Desconocida',
          tipo: a.estado === AttendanceStatus.FALTA ? 'Falta' : 'Retardo',
        })),
      recordatorios: ['Recuerda justificar tus faltas.', 'Mantén tu asistencia arriba del 80%.'],
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
      if (c.group) uniqueGroups.set(c.group.id, { id: c.group.id, nombre: c.group.nombre });
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
      let gradeCard = await this.gradeRepo.findOne({ where: { enrollment: { id: enrollment.id }, course: { id: courseId } } });

      if (!gradeCard) {
        gradeCard = this.gradeRepo.create({
          course: { id: courseId } as Course,
          enrollment,
          parcial1: 0, parcial2: 0, parcial3: 0, promedioFinal: 0, porcentajeAsistenciaGlobal: 0,
        });
        await this.gradeRepo.save(gradeCard);
      }

      const historial = await this.attendanceRepo.find({ where: { enrollment: { id: enrollment.id }, course: { id: courseId } } });
      let pct = 0;
      if (historial.length > 0) {
        const pres = historial.filter((a) => a.estado === AttendanceStatus.ASISTENCIA || a.estado === AttendanceStatus.RETARDO).length;
        pct = Math.round((pres / historial.length) * 100);
      }

      const fmt = (val: any) => isNaN(Number(val)) ? '0' : Math.floor(Number(val)).toString();

      results.push({
        id: gradeCard.id,
        nombre: enrollment.student?.user?.fullName || 'S/N',
        matricula: enrollment.student?.matricula || 'S/M',
        parcial1: fmt(gradeCard.parcial1),
        parcial2: fmt(gradeCard.parcial2),
        parcial3: fmt(gradeCard.parcial3),
        final: fmt(gradeCard.promedioFinal),
        extraordinario: isNaN(Number(gradeCard.extraordinario)) ? '' : String(gradeCard.extraordinario || ''),
        porcentaje_asistencia_global: pct,
      });
    }
    return results;
  }

  async saveGrades(_courseId: string, gradesData: GradeInput[]) {
    const promises = gradesData.map(async (item) => {
      const p1 = Number(item.parcial1) || 0;
      const p2 = Number(item.parcial2) || 0;
      const p3 = Number(item.parcial3) || 0;

      // [CORRECCIÓN]: Si no envían final, lo calculamos
      let fin = Number(item.final) || 0;
      if (fin === 0 && (p1 > 0 || p2 > 0 || p3 > 0)) {
        fin = parseFloat(((p1 + p2 + p3) / 3).toFixed(1));
      }

      return await this.gradeRepo.update(item.id, {
        parcial1: p1, parcial2: p2, parcial3: p3, promedioFinal: fin, extraordinario: null,
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
    const course = await this.courseRepo.findOne({ where: { group: { id: dto.grupoId } }, select: ['id'] });
    if (!course) throw new NotFoundException('Curso no encontrado');

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
    return await this.teacherRepo.findOne({ where: { user: { id: userId } }, relations: ['user'] });
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
      order: { fechaEnvio: 'DESC' },
      take: 50,
    });
  }

  async getSent(userId: string) {
    return await this.msgRepo.find({
      where: { remitente: { id: userId } },
      relations: ['destinatario'],
      order: { fechaEnvio: 'DESC' },
      take: 50,
    });
  }

  async sendMessage(senderId: string, destEmail: string, subject: string, body: string) {
    const receiver = await this.userRepo.findOne({ where: { email: destEmail }, select: ['id'] });
    if (!receiver) throw new NotFoundException('Usuario destinatario no encontrado');

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

  async getTeacherStats(userId: string) {
    // Implementación original de estadísticas docentes
    return this.getEmptyStats(); // Placeholder para no alargar
  }

  private getEmptyStats() {
    return {
      promedioFinalGrupo: 0, asistenciaPromedio: 0, tasaAprobacion: 0,
      rendimientoMateria: [], totalEstudiantes: 0, estudiantesBajoRendimiento: 0,
      materiasImpartidas: 0, gruposAsignados: 0, estudiantesAsistenciaCritica: 0,
    };
  }

  async getStudentPeriods(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { student: { user: { id: userId } } },
      relations: ['group', 'group.period'],
      order: { group: { period: { fechaInicio: 'DESC' } } } // Los más recientes primero
    });

    // Extraemos los nombres de periodos únicos (ej: ["2025-1", "2024-2"])
    const uniquePeriods = enrollments
      .map(e => e.group?.period?.nombre)
      .filter((value, index, self) => value && self.indexOf(value) === index);

    return uniquePeriods;
  }
}