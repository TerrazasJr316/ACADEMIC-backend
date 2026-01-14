import { Controller, Get } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('teacher/groups') // Esta es la "dirección" que el Front buscará
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }
}