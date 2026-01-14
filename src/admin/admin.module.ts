import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminProfile } from './entities/admin-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminProfile])
  ],
  controllers: [],
  providers: [],

})
export class AdminModule {}