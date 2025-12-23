import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { AdminModule } from './admin/admin.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [CoreModule, AuthModule, TenantsModule, AdminModule, TeacherModule, StudentModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
