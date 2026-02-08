-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "periodicidade" TEXT NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "checklistId" INTEGER NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecucaoChecklist" (
    "id" SERIAL NOT NULL,
    "dataExecucao" TIMESTAMP(3) NOT NULL,
    "checklistId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecucaoChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecucaoItem" (
    "id" SERIAL NOT NULL,
    "concluido" BOOLEAN NOT NULL,
    "execucaoId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "ExecucaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoChecklist" ADD CONSTRAINT "ExecucaoChecklist_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoChecklist" ADD CONSTRAINT "ExecucaoChecklist_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoItem" ADD CONSTRAINT "ExecucaoItem_execucaoId_fkey" FOREIGN KEY ("execucaoId") REFERENCES "ExecucaoChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoItem" ADD CONSTRAINT "ExecucaoItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
