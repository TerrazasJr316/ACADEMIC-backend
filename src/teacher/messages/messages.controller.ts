import { Controller, Get } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('teacher/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }
}