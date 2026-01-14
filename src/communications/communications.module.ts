import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { InternalMessage } from './entities/internal-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, InternalMessage])
  ],
  controllers: [],
  providers: [],
})
export class CommunicationsModule {}