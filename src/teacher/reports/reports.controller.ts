import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('teacher/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary/:id')
  getSummary(@Param('id') id: string) {
    return this.reportsService.getSummary(id);
  }
}