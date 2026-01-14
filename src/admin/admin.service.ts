import { Injectable } from '@nestjs/common';
import { IGroup } from './interfaces/group.interface';
import { CreateGroupDto } from './dto/create-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ReportQueryDto } from './dto/report-query.dto';

// --- INTERFACES ---

export interface IMessage {
  id: number;
  fecha: string;
  destinatario: string;
  asunto: string;
  cuerpo: string;
}

export interface IPlan {
  id: string;
  nombre: string;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface ISubject {
  id: string;
  nombre: string;
  codigo: string;
  planId: string;
}

export interface IStudent {
  id: string;
  matricula: string;
  nombre: string;
  groupId: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  fechaNacimiento?: string;
  curp?: string;
  tutor?: string;
  telefonoTutor?: string;
  promedio?: number;
  faltas?: number;
  asistencias?: number;
  pagos?: any[];
  solicitudes?: any[];
}

// NUEVA INTERFAZ: Docentes
export interface ITeacher {
  id: string;
  clave: string;
  nombre: string;
  email: string;
  telefono?: string;
  especialidad?: string;
}

export interface IReportEntry {
  matricula: string;
  nombreAlumno: string;
  calificacion: number;
  asistencia: string;
}

@Injectable()
export class AdminService {
  private groups: IGroup[] = [];
  private messages: IMessage[] = []; 
  private plans: IPlan[] = [];      
  private subjects: ISubject[] = []; 
  private students: IStudent[] = []; 
  // Almacén de docentes con datos iniciales de prueba
  private teachers: ITeacher[] = [
    { id: '1', clave: 'DOC-1001', nombre: 'Rodolfo Docente', email: 'drodolfo@tesji.com' },
    { id: '2', clave: 'DOC-1002', nombre: 'Marta Ríos', email: 'marta@tesji.com' }
  ];

  // --- MÉTODOS DE DASHBOARD ---
  // Proporciona los contadores para las tarjetas del panel
  getDashboardStats() {
    return {
      totalStudents: this.students.length,
      totalTeachers: this.teachers.length,
      totalGroups: this.groups.length
    };
  }

  // --- MÉTODOS DE DOCENTES (NUEVO) ---

  findAllTeachers(): ITeacher[] {
    return this.teachers;
  }

  // Lógica para la modal "Registrar Nuevo Docente"
  createTeacher(dto: any): ITeacher {
    const newTeacher: ITeacher = {
      id: Math.random().toString(36).substr(2, 9),
      clave: dto.clave,
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      especialidad: dto.especialidad
    };
    this.teachers.push(newTeacher);
    return newTeacher;
  }

  // Lógica para eliminar perfil de docente
  removeTeacher(id: string): boolean {
    const initialLength = this.teachers.length;
    this.teachers = this.teachers.filter(t => t.id !== id);
    return this.teachers.length < initialLength;
  }

  // --- MÉTODOS DE GRUPOS ---

  findAll(): IGroup[] { return this.groups; }

  create(dto: CreateGroupDto): IGroup {
    const newGroup: IGroup = {
      id: Math.random().toString(36).substr(2, 9),
      ...dto,
      nombreCompleto: `GRUPO ${dto.grado}${dto.letra.toUpperCase()}`
    };
    this.groups.push(newGroup);
    return newGroup;
  }

  update(id: string, dto: any): IGroup | null {
    const index = this.groups.findIndex(g => g.id === id);
    if (index !== -1) {
      this.groups[index] = { 
        ...this.groups[index], 
        ...dto,
        nombreCompleto: `GRUPO ${dto.grado || this.groups[index].grado}${dto.letra || this.groups[index].letra}`
      };
      return this.groups[index];
    }
    return null;
  }

  remove(id: string): boolean {
    const initialLength = this.groups.length;
    this.groups = this.groups.filter(group => group.id !== id);
    return this.groups.length < initialLength;
  }

  // --- MÉTODOS DE ESTUDIANTES ---

  getStudentsByGroup(groupId: string): IStudent[] {
    return this.students.filter(s => s.groupId === groupId);
  }

  getStudentById(id: string): IStudent | null {
    const student = this.students.find(s => s.id === id);
    if (!student) return null;

    return {
      ...student,
      promedio: student.promedio || 8.5,
      faltas: student.faltas || 4,
      asistencias: student.asistencias || 42,
      pagos: [
        { id: 1, concepto: 'Matrícula Semestral', fecha: '15/01/2024', monto: 5000, estado: 'Pagado' },
        { id: 2, concepto: 'Mensualidad Enero', fecha: '05/01/2024', monto: 2500, estado: 'Pagado' },
        { id: 3, concepto: 'Mensualidad Febrero', fecha: 'Pendiente', monto: 2500, estado: 'Pendiente' }
      ],
      solicitudes: [
        { id: 1, tipo: 'Constancia de Estudios', fecha: '20/01/2024', estado: 'Aprobada' },
        { id: 2, tipo: 'Justificación de Falta', fecha: '18/01/2024', estado: 'En revisión' }
      ]
    };
  }

  createStudent(dto: any): IStudent {
    const newStudent: IStudent = {
      id: Math.random().toString(36).substr(2, 9),
      matricula: dto.matricula,
      nombre: dto.nombre,
      groupId: dto.groupId,
      correo: '',
      telefono: '',
      direccion: '',
      curp: '',
      tutor: ''
    };
    this.students.push(newStudent);
    return newStudent;
  }

  updateStudent(id: string, dto: any): IStudent | null {
    const index = this.students.findIndex(s => s.id === id);
    if (index !== -1) {
      this.students[index] = { ...this.students[index], ...dto };
      return this.students[index];
    }
    return null;
  }

  async getStudentListPDF(groupId: string): Promise<Buffer> {
    return Buffer.from(`Lista oficial de asistencia - Grupo ${groupId}`);
  }

  async getStudentHistoryPDF(id: string): Promise<Buffer> {
    const student = this.getStudentById(id);
    return Buffer.from(`Historial Académico Completo - ${student?.nombre}`);
  }

  // --- MÉTODOS DE MENSAJES ---

  sendMessage(dto: SendMessageDto) {
    const newMessage: IMessage = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      ...dto
    };
    this.messages.push(newMessage);
    return { success: true, message: 'Comunicado enviado correctamente' };
  }

  getMessageHistory(): IMessage[] { return this.messages; }

  // --- MÉTODOS DE GESTIÓN ACADÉMICA ---

  createPlan(dto: any): IPlan {
    const newPlan: IPlan = {
      id: Math.random().toString(36).substr(2, 9),
      nombre: dto.nombre,
      codigo: dto.codigo,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin
    };
    this.plans.push(newPlan);
    return newPlan;
  }

  findAllPlans(): IPlan[] { return this.plans; }

  updatePlan(id: string, dto: any): IPlan | null {
    const index = this.plans.findIndex(p => p.id === id);
    if (index !== -1) {
      this.plans[index] = { ...this.plans[index], ...dto };
      return this.plans[index];
    }
    return null;
  }

  removePlan(id: string): boolean {
    const initialLength = this.plans.length;
    this.plans = this.plans.filter(p => p.id !== id);
    this.subjects = this.subjects.filter(s => s.planId !== id);
    return this.plans.length < initialLength;
  }

  createSubject(dto: any): ISubject {
    const newSubject: ISubject = {
      id: Math.random().toString(36).substr(2, 9),
      nombre: dto.nombre,
      codigo: dto.codigo,
      planId: dto.planId 
    };
    this.subjects.push(newSubject);
    return newSubject;
  }

  getSubjectsByPlan(planId: string): ISubject[] {
    return this.subjects.filter(s => s.planId === planId);
  }

  updateSubject(id: string, dto: any): ISubject | null {
    const index = this.subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      this.subjects[index] = { ...this.subjects[index], ...dto };
      return this.subjects[index];
    }
    return null;
  }

  removeSubject(id: string): boolean {
    const initialLength = this.subjects.length;
    this.subjects = this.subjects.filter(s => s.id !== id);
    return this.subjects.length < initialLength;
  }

  // --- MÉTODOS DE REPORTES ---

  generateAcademicReport(query: ReportQueryDto): IReportEntry[] {
    const mockData: IReportEntry[] = [
      { matricula: 'A001', nombreAlumno: 'Juan Pérez López', calificacion: 9.5, asistencia: '95%' },
      { matricula: 'A002', nombreAlumno: 'María González Ruiz', calificacion: 8.0, asistencia: '100%' }
    ];

    if (query.alumnoMatricula) {
      return mockData.filter(s => s.matricula === query.alumnoMatricula);
    }
    return mockData;
  }

  async getReportPDF(query: ReportQueryDto): Promise<Buffer> {
    return Buffer.from('Contenido binario del reporte PDF'); 
  }
}