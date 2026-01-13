// src/admin/interfaces/group.interface.ts
export interface IGroup {
  id: string;
  grado: string;
  letra: string;
  numeroAlumnos: number;
  turno: 'Matutino' | 'Vespertino';
  nombreCompleto: string;
}