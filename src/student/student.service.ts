import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentService {
  // 1. Centralizamos las notificaciones
  private readonly misNotificaciones = [
    { id: 'n1', mensaje: 'Tu calificación final de Matemáticas I es 9.5.', leida: false, fecha: '2024-09-03', tipo: 'calificacion' },
    { id: 'n2', mensaje: 'Se ha creado una nueva tarea en Programación Web.', leida: false, fecha: '2024-09-03', tipo: 'tarea' },
    { id: 'n3', mensaje: 'La Mtra. Ana García ha enviado un nuevo mensaje.', leida: true, fecha: '2024-07-03', tipo: 'mensaje' },
    { id: 'n4', mensaje: 'El horario de la clase de Física ha sido modificado.', leida: true, fecha: '2024-09-03', tipo: 'aviso' },
  ];

  // ... (existing code for profile and subjects ...)

  // Datos del Perfil (Mock para Sofia Rodriguez)
  getProfile(id: string) {
    return {
      informacionPersonal: {
        nombreCompleto: 'Sofia Rodriguez',
        id: '12345678910',
        fechaNacimiento: '2000-03-15',
        sexo: 'Femenino',
        fotoPerfil: 'https://i.pravatar.cc/300?img=5',
        email: 'sofia.rodriguez@email.com',
        telefono: '+52 55 1234 5678',
        direccion: 'Calle Principal #123, Colonia Centro, Ciudad de México, CP 06000',
        carrera: 'Ingeniería en Sistemas Computacionales',
        semestre: 'Quinto Semestre',
        promedio: 8.5,
      },
      datosAcademicos: {
        semestre: 'Quinto Semestre',
        promedio: 8.5,
        estado: 'Activo',
        materiasAprobadas: 42,
        fechaIngreso: 'Agosto 2021',
      },
      pagos: {
        monto: 1092.00,
        fecha: new Date().toISOString().split('T')[0], // Fecha Actual
        concepto: 'Consulta adeudos de Documentos Solicitados',
      },
    };
  }

  // materias que el alumno está cursando HOY (Periodo 2025-1)
  getSubjects(id: string) {
    return [
      { id: 'web-1', materia: 'Desarrollo Web Profesional', profesor: 'Ing. Iván Terrazas', horarios: [{ dia: 'Lunes', hora: '08:00-10:00' }, { dia: 'Miércoles', hora: '08:00-10:00' }] },
      { id: 'db-2', materia: 'Bases de Datos Avanzadas', profesor: 'Lic. María García', horarios: [{ dia: 'Martes', hora: '10:00-12:00' }, { dia: 'Jueves', hora: '10:00-12:00' }] },
      { id: 'arch-3', materia: 'Arquitectura de Software', profesor: 'Mtro. Roberto Gómez', horarios: [{ dia: 'Viernes', hora: '07:00-10:00' }] }
    ];
  }

  // Historial de lo que YA pasó (Pre-requisitos de las materias actuales)
  getAcademicHistory(id: string) {
    return {
      promedioGeneral: 9.2,
      asignaturasAprobadas: 15,
      calificacionesDetalle: [
        { asignatura: 'Programación Básica', promedio: 10, periodo: '2024-1' }, // Pre-requisito de Desarrollo Web
        { asignatura: 'Bases de Datos I', promedio: 8.5, periodo: '2024-1' },    // Pre-requisito de Bases de Datos Avanzadas
        { asignatura: 'Estructuras de Datos', promedio: 9.0, periodo: '2024-2' },
        { asignatura: 'Ingeniería de Software', promedio: 9.5, periodo: '2024-2' } // Pre-requisito de Arquitectura
      ],
      documentosDisponibles: [
        { nombre: 'Boleta de Calificaciones 2024-2', url: '#' },
        { nombre: 'Constancia de Estudios Actual', url: '#' }
      ]
    };
  }

  getAvailablePeriods(id: string) {
    return ['2025-1', '2024-2', '2024-1'];
  }

  // Notas parciales del semestre actual (Sincronizado con getSubjects)
  getPartialGrades(id: string, periodo: string) {
    if (periodo === '2025-1') {
      return [
        { materia: "Desarrollo Web Profesional", u1: "10", u2: "9", u3: "10", u4: "---", u5: "---", final: "---" },
        { materia: "Bases de Datos Avanzadas", u1: "8", u2: "8", u3: "9", u4: "---", u5: "---", final: "---" },
        { materia: "Arquitectura de Software", u1: "9", u2: "9", u3: "---", u4: "---", u5: "---", final: "---" }
      ];
    }
    return [];
  }

  // Resumen de asistencia y avisos unificados
  getAttendanceData(id: string) {
    return {
      estadisticas: { asistencia: 95, faltas: 1, retardos: 1 },
      fechas: [
        { fecha: '2026-01-05', tipo: 'Retardo' }, // Lunes: Retardo en Desarrollo Web
        { fecha: '2026-01-08', tipo: 'Falta' }    // Jueves: Falta en Bases de Datos
      ],
      recordatorios: this.misNotificaciones
    };
  }

  // Detalle por materia (Sincronizado con el horario y fechas de arriba)
  getAttendanceDetails(id: string) {
    return [
      { fecha: "2026-01-05", materia: "Desarrollo Web Profesional", estado: "Retardo" },
      { fecha: "2026-01-07", materia: "Desarrollo Web Profesional", estado: "Asistencia" },
      { fecha: "2026-01-08", materia: "Bases de Datos Avanzadas", estado: "Falta" },
      { fecha: "2026-01-09", materia: "Arquitectura de Software", estado: "Asistencia" }
    ];
  }

  getNotifications(id: string, query?: string) {
    if (!query) {
      return this.misNotificaciones;
    }
    const lowerQuery = query.toLowerCase();
    return this.misNotificaciones.filter(n => 
      n.mensaje.toLowerCase().includes(lowerQuery)
    );
  }
}