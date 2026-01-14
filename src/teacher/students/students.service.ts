import { Injectable } from '@nestjs/common';

@Injectable()
export class StudentsService {
  private students = [
    { 
      id: '1', 
      nombre: 'Juan Pérez', 
      matricula: '2024001', 
      email: 'juan@example.com', 
      calificacion: 9.5, 
      asistencia: 'Presente', 
      groupId: '1',
      comentarios: 'Excelente participación.'
    },
    { 
      id: '2', 
      nombre: 'María García', 
      matricula: '2024002', 
      email: 'maria@example.com', 
      calificacion: 8.0, 
      asistencia: 'Ausente', 
      groupId: '1'
    },
    { 
      id: '3', 
      nombre: 'Carlos López', 
      matricula: '2024003', 
      email: 'carlos@example.com', 
      calificacion: 7.5, 
      asistencia: 'Presente', 
      groupId: '2'
    },
  ];

  findByGroup(groupId: string) {
    return this.students.filter(s => s.groupId === groupId);
  }

  findAll() {
    return this.students;
  }
}