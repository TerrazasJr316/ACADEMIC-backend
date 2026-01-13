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

  // ACTUALIZADO: Lógica para la modal "Editar Grupo"
  update(id: string, dto: any): IGroup | null {
    const index = this.groups.findIndex(g => g.id === id);
    if (index !== -1) {
      this.groups[index] = { 
        ...this.groups[index], 
        ...dto,
        // Recalculamos el nombre completo basado en los nuevos campos de la modal
        nombreCompleto: `GRUPO ${dto.grado || this.groups[index].grado}${dto.letra || this.groups[index].letra}`
      };
      return this.groups[index];
    }
    return null;
  }

  // ACTUALIZADO: Eliminar grupo desde el enlace rojo de la tarjeta
  remove(id: string): boolean {
    const initialLength = this.groups.length;
    this.groups = this.groups.filter(group => group.id !== id);
    return this.groups.length < initialLength;
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

  // --- MÉTODOS DE GESTIÓN ACADÉMICA (PLANES) ---

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

  // --- MÉTODOS DE GESTIÓN ACADÉMICA (MATERIAS) ---

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
      { matricula: 'A002', nombreAlumno: 'María González Ruiz', calificacion: 8.0, asistencia: '100%' },
      { matricula: '20201234', nombreAlumno: 'Carlos Sánchez García', calificacion: 7.5, asistencia: '88%' }
    ];

    if (query.alumnoMatricula) {
      return mockData.filter(s => s.matricula === query.alumnoMatricula);
    }
    return mockData;
  }

  async getReportPDF(query: ReportQueryDto): Promise<Buffer> {
    const data = this.generateAcademicReport(query);
    console.log(`Generando PDF para ${data.length} alumnos del grupo ${query.groupId}`);
    return Buffer.from('Contenido binario del reporte PDF'); 
  }
}