import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './support/test-app';

/**
 * Security section 6 of the audit brief: every company-owned resource must
 * be filtered by the authenticated user's empresaId - checking the resource
 * id alone is not enough. These tests specifically try to reach another
 * company's data by guessing/reusing ids, exactly as described there.
 */
describe('Multi-tenancy (e2e)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof request>;

  let authA: { Authorization: string };
  let authB: { Authorization: string };
  let colabAId: number;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    api = request(app.getHttpServer());

    const regA = await api.post('/api/auth/register').send({
      nome: 'Admin A', email: 'admin.a@tenant.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa A',
    });
    const loginA = await api.post('/api/auth/login').send({ email: 'admin.a@tenant.com', senha: 'senhaForte123' });
    authA = { Authorization: `Bearer ${loginA.body.access_token}` };

    await api.post('/api/auth/register').send({
      nome: 'Admin B', email: 'admin.b@tenant.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa B',
    });
    const loginB = await api.post('/api/auth/login').send({ email: 'admin.b@tenant.com', senha: 'senhaForte123' });
    authB = { Authorization: `Bearer ${loginB.body.access_token}` };

    const colabA = await api.post('/api/usuarios').set(authA).send({
      nome: 'Colaborador A', email: 'colab.a@tenant.com', senha: 'senhaForte123', perfil: 'COLABORADOR',
    });
    colabAId = colabA.body.id;

    void regA;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /usuarios/:id', () => {
    it('empresa B cannot fetch an empresa A usuario by id (404, not 403 or leaked data)', async () => {
      const res = await api.get(`/api/usuarios/${colabAId}`).set(authB);
      expect(res.status).toBe(404);
    });

    it("empresa A's own usuario listing never contains empresa B's users", async () => {
      const res = await api.get('/api/usuarios').set(authA);
      expect(res.status).toBe(200);
      // exactly admin A + colaborador A were ever created for this company
      expect(res.body).toHaveLength(2);
      expect(res.body.some((u: any) => u.id === colabAId)).toBe(true);
    });
  });

  describe('GET/PUT/DELETE /checklists/:id', () => {
    let checklistAId: number;

    beforeAll(async () => {
      const res = await api.post('/api/checklists').set(authA).send({ titulo: 'Checklist A', periodicidade: 'DIARIO' });
      checklistAId = res.body.id;
      await api.post(`/api/checklists/${checklistAId}/itens`).set(authA).send({ descricao: 'Item', obrigatorio: true });
    });

    it('empresa B cannot GET it by id', async () => {
      const res = await api.get(`/api/checklists/${checklistAId}`).set(authB);
      expect(res.status).toBe(404);
    });

    it('empresa B cannot UPDATE it via PUT', async () => {
      const res = await api.put(`/api/checklists/${checklistAId}`).set(authB).send({ titulo: 'Invadido', periodicidade: 'DIARIO' });
      expect(res.status).toBe(404);
    });

    it('empresa B cannot add items to it', async () => {
      const res = await api.post(`/api/checklists/${checklistAId}/itens`).set(authB).send({ descricao: 'Invasor' });
      expect(res.status).toBe(404);
    });

    it('empresa B cannot DELETE it', async () => {
      const res = await api.delete(`/api/checklists/${checklistAId}`).set(authB);
      expect(res.status).toBe(404);
    });

    it("empresa B's checklist listing never contains empresa A's checklist", async () => {
      const res = await api.get('/api/checklists').set(authB);
      expect(res.body.some((c: any) => c.id === checklistAId)).toBe(false);
    });
  });

  describe('GET /execucoes/:id and query filters', () => {
    let checklistAId: number;
    let execucaoAId: number;

    beforeAll(async () => {
      const checklist = await api.post('/api/checklists').set(authA).send({ titulo: 'Checklist Exec A', periodicidade: 'DIARIO' });
      checklistAId = checklist.body.id;
      await api.post(`/api/checklists/${checklistAId}/itens`).set(authA).send({ descricao: 'Item', obrigatorio: true });

      const colabLogin = await api.post('/api/auth/login').send({ email: 'colab.a@tenant.com', senha: 'senhaForte123' });
      const execRes = await api
        .post(`/api/execucoes/checklists/${checklistAId}`)
        .set({ Authorization: `Bearer ${colabLogin.body.access_token}` });
      execucaoAId = execRes.body.id;
    });

    it('empresa B cannot GET empresa A execution by id', async () => {
      const res = await api.get(`/api/execucoes/${execucaoAId}`).set(authB);
      expect(res.status).toBe(404);
    });

    it('empresa B cannot start an execution of empresa A checklist', async () => {
      const res = await api.post(`/api/execucoes/checklists/${checklistAId}`).set(authB);
      expect(res.status).toBe(404);
    });

    it("empresa B's execution listing never contains empresa A's execution, even without filters", async () => {
      const res = await api.get('/api/execucoes').set(authB);
      expect(res.body.dados.some((e: any) => e.id === execucaoAId)).toBe(false);
    });
  });
});
