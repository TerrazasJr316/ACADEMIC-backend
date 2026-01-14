import { Module } from '@nestjs/common';
import { GroupsModule } from './groups/groups.module';
import { MessagesModule } from './messages/messages.module';
import { ReportsModule } from './reports/reports.module';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    GroupsModule,
    MessagesModule,
    ReportsModule,
    StudentsModule,
  ],
  exports: [
    GroupsModule,
    MessagesModule,
    ReportsModule,
    StudentsModule,
  ]
})
export class TeacherModule {} // 👈 Importante: La clase debe llamarse así y estar exportada