import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './support/test-app';

describe('Roles (e2e)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof request>;
  let authAdmin: { Authorization: string };
  let authColaborador: { Authorization: string };

  beforeAll(async () => {
    ({ app } = await createTestApp());
    api = request(app.getHttpServer());

    await api.post('/api/auth/register').send({
      nome: 'Admin', email: 'admin.roles@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa Roles',
    });
    const adminLogin = await api.post('/api/auth/login').send({ email: 'admin.roles@empresa.com', senha: 'senhaForte123' });
    authAdmin = { Authorization: `Bearer ${adminLogin.body.access_token}` };

    await api.post('/api/usuarios').set(authAdmin).send({
      nome: 'Colaborador', email: 'colab.roles@empresa.com', senha: 'senhaForte123', perfil: 'COLABORADOR',
    });
    const colabLogin = await api.post('/api/auth/login').send({ email: 'colab.roles@empresa.com', senha: 'senhaForte123' });
    authColaborador = { Authorization: `Bearer ${colabLogin.body.access_token}` };
  });

  afterAll(async () => {
    await app.close();
  });

  it('COLABORADOR cannot create a checklist (403)', async () => {
    const res = await api.post('/api/checklists').set(authColaborador).send({ titulo: 'X', periodicidade: 'DIARIO' });
    expect(res.status).toBe(403);
  });

  it('COLABORADOR cannot list or manage usuarios (403)', async () => {
    expect((await api.get('/api/usuarios').set(authColaborador)).status).toBe(403);
    expect((await api.post('/api/usuarios').set(authColaborador).send({})).status).toBe(403);
  });

  it('COLABORADOR cannot access /dashboard/admin (403)', async () => {
    const res = await api.get('/api/dashboard/admin').set(authColaborador);
    expect(res.status).toBe(403);
  });

  it('ADMIN cannot access /dashboard/colaborador (403)', async () => {
    const res = await api.get('/api/dashboard/admin').set(authColaborador);
    expect(res.status).toBe(403);
    const res2 = await api.get('/api/dashboard/colaborador').set(authAdmin);
    expect(res2.status).toBe(403);
  });

  it('both ADMIN and COLABORADOR can read /checklists and /execucoes (no @Roles restriction there)', async () => {
    expect((await api.get('/api/checklists').set(authAdmin)).status).toBe(200);
    expect((await api.get('/api/checklists').set(authColaborador)).status).toBe(200);
    expect((await api.get('/api/execucoes').set(authColaborador)).status).toBe(200);
  });
});

describe('Checklist -> Execucao functional flow (e2e, brief section 4)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof request>;
  let authAdmin: { Authorization: string };
  let authColaborador: { Authorization: string };

  beforeAll(async () => {
    ({ app } = await createTestApp());
    api = request(app.getHttpServer());

    await api.post('/api/auth/register').send({
      nome: 'Admin', email: 'admin.flow@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa Flow',
    });
    const adminLogin = await api.post('/api/auth/login').send({ email: 'admin.flow@empresa.com', senha: 'senhaForte123' });
    authAdmin = { Authorization: `Bearer ${adminLogin.body.access_token}` };

    await api.post('/api/usuarios').set(authAdmin).send({
      nome: 'Colaborador', email: 'colab.flow@empresa.com', senha: 'senhaForte123', perfil: 'COLABORADOR',
    });
    const colabLogin = await api.post('/api/auth/login').send({ email: 'colab.flow@empresa.com', senha: 'senhaForte123' });
    authColaborador = { Authorization: `Bearer ${colabLogin.body.access_token}` };
  });

  afterAll(async () => {
    await app.close();
  });

  it('4.1: cannot start an execution of a checklist with no items (400)', async () => {
    const checklist = await api.post('/api/checklists').set(authAdmin).send({ titulo: 'Vazio', periodicidade: 'DIARIO' });
    const res = await api.post(`/api/execucoes/checklists/${checklist.body.id}`).set(authColaborador);
    expect(res.status).toBe(400);
  });

  describe('full lifecycle: create checklist -> start -> mark items -> finalize', () => {
    let checklistId: number;
    let itemObrigatorio1: number;
    let itemObrigatorio2: number;
    let itemOpcional: number;
    let execucaoId: number;

    beforeAll(async () => {
      const checklist = await api.post('/api/checklists').set(authAdmin).send({ titulo: 'Abertura de loja', periodicidade: 'DIARIO' });
      checklistId = checklist.body.id;

      const i1 = await api.post(`/api/checklists/${checklistId}/itens`).set(authAdmin).send({ descricao: 'Ligar luzes', obrigatorio: true });
      const i2 = await api.post(`/api/checklists/${checklistId}/itens`).set(authAdmin).send({ descricao: 'Conferir caixa', obrigatorio: true });
      const i3 = await api.post(`/api/checklists/${checklistId}/itens`).set(authAdmin).send({ descricao: 'Regar planta', obrigatorio: false });
      itemObrigatorio1 = i1.body.id;
      itemObrigatorio2 = i2.body.id;
      itemOpcional = i3.body.id;
    });

    it('4.1: colaborador starts the execution; all items begin as not concluded', async () => {
      const res = await api.post(`/api/execucoes/checklists/${checklistId}`).set(authColaborador);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('EM_ANDAMENTO');
      expect(res.body.itens).toHaveLength(3);
      expect(res.body.itens.every((i: any) => i.concluido === false)).toBe(true);
      execucaoId = res.body.id;
    });

    it('4.1: starting again while EM_ANDAMENTO reuses the same execution (no duplicate created)', async () => {
      const res = await api.post(`/api/execucoes/checklists/${checklistId}`).set(authColaborador);
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(execucaoId);
    });

    it('4.3: another colaborador in the same company cannot see this execution (404)', async () => {
      await api.post('/api/usuarios').set(authAdmin).send({
        nome: 'Outro', email: 'outro.flow@empresa.com', senha: 'senhaForte123', perfil: 'COLABORADOR',
      });
      const outroLogin = await api.post('/api/auth/login').send({ email: 'outro.flow@empresa.com', senha: 'senhaForte123' });
      const res = await api.get(`/api/execucoes/${execucaoId}`).set({ Authorization: `Bearer ${outroLogin.body.access_token}` });
      expect(res.status).toBe(404);
    });

    it('4.2: ADMIN (same company) can see the execution', async () => {
      const res = await api.get(`/api/execucoes/${execucaoId}`).set(authAdmin);
      expect(res.status).toBe(200);
    });

    it('4.4: marking an item concluded sets concluidoEm; unmarking clears it', async () => {
      const marked = await api.patch(`/api/execucoes/${execucaoId}/itens/${itemObrigatorio1}`).set(authColaborador).send({ concluido: true });
      expect(marked.status).toBe(200);
      expect(marked.body.concluido).toBe(true);
      expect(marked.body.concluidoEm).toBeTruthy();

      const unmarked = await api.patch(`/api/execucoes/${execucaoId}/itens/${itemObrigatorio1}`).set(authColaborador).send({ concluido: false });
      expect(unmarked.body.concluido).toBe(false);
      expect(unmarked.body.concluidoEm).toBeNull();
    });

    it('4.4: the request body is validated - a non-boolean concluido is rejected (400)', async () => {
      const res = await api.patch(`/api/execucoes/${execucaoId}/itens/${itemObrigatorio1}`).set(authColaborador).send({ concluido: 'sim' });
      expect(res.status).toBe(400);
    });

    it('4.6: cannot finalize while a required item is still pending (400)', async () => {
      const res = await api.post(`/api/execucoes/${execucaoId}/finalizar`).set(authColaborador);
      expect(res.status).toBe(400);
    });

    it('4.5: GET :id/progresso reflects partial completion correctly', async () => {
      await api.patch(`/api/execucoes/${execucaoId}/itens/${itemObrigatorio1}`).set(authColaborador).send({ concluido: true });
      const res = await api.get(`/api/execucoes/${execucaoId}/progresso`).set(authColaborador);
      expect(res.status).toBe(200);
      expect(res.body.itensConcluidos).toBe(1);
      expect(res.body.obrigatorios.pendentes).toBe(1);
      expect(res.body.obrigatorios.podeFinalizar).toBe(false);
    });

    it('4.6: finalizing succeeds once every required item is done, regardless of the optional one', async () => {
      await api.patch(`/api/execucoes/${execucaoId}/itens/${itemObrigatorio2}`).set(authColaborador).send({ concluido: true });
      // itemOpcional intentionally left pending
      const res = await api.post(`/api/execucoes/${execucaoId}/finalizar`).set(authColaborador);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('CONCLUIDA');
      expect(res.body.finalizadaEm).toBeTruthy();
      void itemOpcional;
    });

    it('4.6: cannot finalize an already concluded execution again (409)', async () => {
      const res = await api.post(`/api/execucoes/${execucaoId}/finalizar`).set(authColaborador);
      expect(res.status).toBe(409);
    });

    it('4.7: cannot cancel an already concluded execution (409)', async () => {
      const res = await api.post(`/api/execucoes/${execucaoId}/cancelar`).set(authColaborador);
      expect(res.status).toBe(409);
    });

    it('4.4: cannot update items once the execution is no longer EM_ANDAMENTO (409)', async () => {
      const res = await api.patch(`/api/execucoes/${execucaoId}/itens/${itemObrigatorio1}`).set(authColaborador).send({ concluido: false });
      expect(res.status).toBe(409);
    });
  });

  describe('cancel path', () => {
    it('4.7: an EM_ANDAMENTO execution can be cancelled, recording finalizadaEm', async () => {
      const checklist = await api.post('/api/checklists').set(authAdmin).send({ titulo: 'Para cancelar', periodicidade: 'DIARIO' });
      await api.post(`/api/checklists/${checklist.body.id}/itens`).set(authAdmin).send({ descricao: 'Item', obrigatorio: true });
      const exec = await api.post(`/api/execucoes/checklists/${checklist.body.id}`).set(authColaborador);

      const res = await api.post(`/api/execucoes/${exec.body.id}/cancelar`).set(authColaborador);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('CANCELADA');
      expect(res.body.finalizadaEm).toBeTruthy();
    });

    it('4.7: a colaborador cannot cancel another colaborador\'s execution (404); an admin of the same company can', async () => {
      const checklist = await api.post('/api/checklists').set(authAdmin).send({ titulo: 'Outro para cancelar', periodicidade: 'DIARIO' });
      await api.post(`/api/checklists/${checklist.body.id}/itens`).set(authAdmin).send({ descricao: 'Item', obrigatorio: true });
      const exec = await api.post(`/api/execucoes/checklists/${checklist.body.id}`).set(authColaborador);

      const outroLogin = await api.post('/api/auth/login').send({ email: 'outro.flow@empresa.com', senha: 'senhaForte123' });
      const outroCancel = await api.post(`/api/execucoes/${exec.body.id}/cancelar`).set({ Authorization: `Bearer ${outroLogin.body.access_token}` });
      expect(outroCancel.status).toBe(404);

      const adminCancel = await api.post(`/api/execucoes/${exec.body.id}/cancelar`).set(authAdmin);
      expect(adminCancel.status).toBe(201);
    });
  });

  describe('4.8: em-andamento endpoint and 4.2: listing filters', () => {
    it('GET /execucoes/em-andamento only returns in-progress executions for the caller', async () => {
      const checklist = await api.post('/api/checklists').set(authAdmin).send({ titulo: 'Para andamento', periodicidade: 'DIARIO' });
      await api.post(`/api/checklists/${checklist.body.id}/itens`).set(authAdmin).send({ descricao: 'Item', obrigatorio: true });
      await api.post(`/api/execucoes/checklists/${checklist.body.id}`).set(authColaborador);

      const res = await api.get('/api/execucoes/em-andamento').set(authColaborador);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.every((e: any) => e.checklist && e.progresso)).toBe(true);
    });

    it('GET /execucoes supports a status filter and returns a paginacao block', async () => {
      const res = await api.get('/api/execucoes?status=CONCLUIDA&page=1&limit=5').set(authAdmin);
      expect(res.status).toBe(200);
      expect(res.body.dados.every((e: any) => e.status === 'CONCLUIDA')).toBe(true);
      expect(typeof res.body.paginacao.total).toBe('number');
    });

    it('a colaborador-supplied usuarioId filter is ignored, not honored (cannot see others through it)', async () => {
      const colabLogin = await api.post('/api/auth/login').send({ email: 'colab.flow@empresa.com', senha: 'senhaForte123' });
      // colaborador.flow has executions; "outro" tries to read them by passing colaborador's id as a filter
      const outroLogin = await api.post('/api/auth/login').send({ email: 'outro.flow@empresa.com', senha: 'senhaForte123' });
      const outroAuth = { Authorization: `Bearer ${outroLogin.body.access_token}` };

      const meRes = await api.get('/api/usuarios').set(authAdmin);
      const colaboradorId = meRes.body.find((u: any) => u.email === 'colab.flow@empresa.com').id;

      const res = await api.get(`/api/execucoes?usuarioId=${colaboradorId}`).set(outroAuth);
      expect(res.status).toBe(200);
      expect(res.body.dados).toHaveLength(0);
      void colabLogin;
    });
  });
});
