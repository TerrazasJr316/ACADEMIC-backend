import { Injectable } from '@nestjs/common';

@Injectable()
export class TeacherService {
  getAcademicLoad() {
    // Quitamos la variable _teacherId para que no diga que no se usa
    // Agregamos todas las comas al final de los objetos y arreglos (Trailing commas)
    return [
      {
        id: 1,
        nombre: 'Matemáticas Avanzadas',
        clave: 'MA-234',
        salon: 'N2',
        horarios: [
          { dia: 'Lunes', hora_inicio: '10:00', hora_fin: '11:00' },
          { dia: 'Martes', hora_inicio: '10:00', hora_fin: '11:00' },
        ],
      },
      {
        id: 2,
        nombre: 'Español',
        clave: 'ESP-128',
        salon: 'F3',
        horarios: [
          { dia: 'Miercoles', hora_inicio: '09:00', hora_fin: '10:00' },
          { dia: 'Viernes', hora_inicio: '09:00', hora_fin: '10:00' },
        ],
      },
      {
        id: 3,
        nombre: 'Historia',
        clave: 'HI-256',
        salon: 'E4',
        horarios: [
          { dia: 'Jueves', hora_inicio: '12:00', hora_fin: '13:00' },
          { dia: 'Viernes', hora_inicio: '12:00', hora_fin: '13:00' },
        ],
      },
    ];
  }
}
