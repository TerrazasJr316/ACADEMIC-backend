import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';

@Injectable()
export class AcademicService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async getTeacherLoad(teacherId: string) {
    return await this.courseRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['subject', 'group', 'schedules'],
    });
  }
}
