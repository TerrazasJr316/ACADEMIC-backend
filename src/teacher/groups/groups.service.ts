import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupsService {
  private groups = [
    { id: '1', nombre: 'Grupo A - Matemáticas' },
    { id: '2', nombre: 'Grupo B - Física' }
  ];

  findAll() {
    return this.groups;
  }
}