import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  // Datos simulados que coinciden con la interfaz del Frontend
  private summaryData = {
    promedioFinalGrupo: 8.7,
    asistenciaPromedio: 92,
    tasaAprobacion: 85,
    totalEstudiantes: 32,
    estudiantesBajoRendimiento: 4,
    materiasImpartidas: 5,
    gruposAsignados: 3,
    estudiantesAsistenciaCritica: 2,
    rendimientoMateria: [
      { materia: 'Matemáticas', promedio: 8.5 },
      { materia: 'Física', promedio: 7.8 },
      { materia: 'Programación', promedio: 9.2 },
      { materia: 'Base de Datos', promedio: 8.0 },
      { materia: 'Ética', promedio: 9.8 }
    ]
  };

  getSummary(docenteId: string) {
    // Por ahora ignoramos el docenteId y regresamos la data de prueba
    return this.summaryData;
  }
}