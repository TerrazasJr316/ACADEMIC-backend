import { Injectable } from '@nestjs/common';

@Injectable()
export class MessagesService {
  private messages = [
    { id: '1', remitente: 'Director', contenido: 'Reunión de consejo técnico el viernes.', fecha: '2024-05-20' },
    { id: '2', remitente: 'Sistema', contenido: 'Se han cargado las nuevas listas de asistencia.', fecha: '2024-05-21' }
  ];

  findAll() {
    return this.messages;
  }
}