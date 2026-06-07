import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {

constructor(private prisma: PrismaService) {}

    async getDashboard(
 empresaId: number
) {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

 const [
   usuarios,
   checklists,
   execucoesMes
 ] = await Promise.all([

   this.prisma.usuario.count({
     where: { empresaId }
   }),

   this.prisma.checklist.count({
     where: {
       empresaId,
       ativo: true
     }
   }),

   this.prisma.execucaoChecklist.count({
     where: {
       checklist: {
         empresaId
       },
       createdAt: {
         gte: inicioMes
       }
     }
   })
 ]);

 return {
   usuarios,
   checklistsAtivos: checklists,
   execucoesMes
 };
}
}
