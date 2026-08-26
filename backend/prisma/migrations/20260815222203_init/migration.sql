/*
  Warnings:

  - You are about to drop the column `dataExecucao` on the `ExecucaoChecklist` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `ExecucaoItem` table. All the data in the column will be lost.
  - You are about to drop the `ChecklistItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[execucaoId,itemChecklistId]` on the table `ExecucaoItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Checklist` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `periodicidade` on the `Checklist` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Empresa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `empresaId` to the `ExecucaoChecklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ExecucaoChecklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemChecklistId` to the `ExecucaoItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perfil` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'COLABORADOR');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('DIARIO', 'SEMANAL');

-- CreateEnum
CREATE TYPE "StatusExecucao" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "ChecklistItem" DROP CONSTRAINT "ChecklistItem_checklistId_fkey";

-- DropForeignKey
ALTER TABLE "ExecucaoItem" DROP CONSTRAINT "ExecucaoItem_execucaoId_fkey";

-- DropForeignKey
ALTER TABLE "ExecucaoItem" DROP CONSTRAINT "ExecucaoItem_itemId_fkey";

-- AlterTable
ALTER TABLE "Checklist" ADD COLUMN     "horarioDisponivelFim" TEXT,
ADD COLUMN     "horarioDisponivelInicio" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "periodicidade",
ADD COLUMN     "periodicidade" "Periodicidade" NOT NULL;

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ExecucaoChecklist" DROP COLUMN "dataExecucao",
ADD COLUMN     "empresaId" INTEGER NOT NULL,
ADD COLUMN     "finalizadaEm" TIMESTAMP(3),
ADD COLUMN     "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "StatusExecucao" NOT NULL DEFAULT 'EM_ANDAMENTO',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ExecucaoItem" DROP COLUMN "itemId",
ADD COLUMN     "concluidoEm" TIMESTAMP(3),
ADD COLUMN     "itemChecklistId" INTEGER NOT NULL,
ALTER COLUMN "concluido" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "perfil" "Perfil" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ChecklistItem";

-- CreateTable
CREATE TABLE "ItemChecklist" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "checklistId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemChecklist_checklistId_idx" ON "ItemChecklist"("checklistId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemChecklist_checklistId_ordem_key" ON "ItemChecklist"("checklistId", "ordem");

-- CreateIndex
CREATE INDEX "Checklist_empresaId_idx" ON "Checklist"("empresaId");

-- CreateIndex
CREATE INDEX "Checklist_empresaId_ativo_idx" ON "Checklist"("empresaId", "ativo");

-- CreateIndex
CREATE INDEX "Checklist_empresaId_periodicidade_idx" ON "Checklist"("empresaId", "periodicidade");

-- CreateIndex
CREATE INDEX "Empresa_nome_idx" ON "Empresa"("nome");

-- CreateIndex
CREATE INDEX "ExecucaoChecklist_empresaId_idx" ON "ExecucaoChecklist"("empresaId");

-- CreateIndex
CREATE INDEX "ExecucaoChecklist_empresaId_status_idx" ON "ExecucaoChecklist"("empresaId", "status");

-- CreateIndex
CREATE INDEX "ExecucaoChecklist_usuarioId_idx" ON "ExecucaoChecklist"("usuarioId");

-- CreateIndex
CREATE INDEX "ExecucaoChecklist_checklistId_idx" ON "ExecucaoChecklist"("checklistId");

-- CreateIndex
CREATE INDEX "ExecucaoChecklist_iniciadaEm_idx" ON "ExecucaoChecklist"("iniciadaEm");

-- CreateIndex
CREATE INDEX "ExecucaoItem_execucaoId_idx" ON "ExecucaoItem"("execucaoId");

-- CreateIndex
CREATE INDEX "ExecucaoItem_itemChecklistId_idx" ON "ExecucaoItem"("itemChecklistId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecucaoItem_execucaoId_itemChecklistId_key" ON "ExecucaoItem"("execucaoId", "itemChecklistId");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_ativo_idx" ON "Usuario"("empresaId", "ativo");

-- AddForeignKey
ALTER TABLE "ItemChecklist" ADD CONSTRAINT "ItemChecklist_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoChecklist" ADD CONSTRAINT "ExecucaoChecklist_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoItem" ADD CONSTRAINT "ExecucaoItem_execucaoId_fkey" FOREIGN KEY ("execucaoId") REFERENCES "ExecucaoChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoItem" ADD CONSTRAINT "ExecucaoItem_itemChecklistId_fkey" FOREIGN KEY ("itemChecklistId") REFERENCES "ItemChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
