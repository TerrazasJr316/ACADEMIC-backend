import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionCatalog } from './entities/transaction-catalog.entity';
import { School } from '../tenants/entities/school.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(TransactionCatalog)
    private readonly catalogRepo: Repository<TransactionCatalog>,
  ) {}

  // Crear un nuevo concepto de cobro (Ej: "Inscripción", "Examen", "Colegiatura")
  async createConcept(data: any, schoolId: string) {
    const newConcept = this.catalogRepo.create({
      ...data,
      school: { id: schoolId } as School // Vinculamos a la escuela
    });
    return this.catalogRepo.save(newConcept);
  }

  // Listar todo el menú de precios de una escuela
  async findAll(schoolId: string) {
    return this.catalogRepo.find({
      where: { school: { id: schoolId } }
    });
  }
}