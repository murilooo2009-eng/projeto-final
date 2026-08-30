import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './support/test-app';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof request>;
  let authAdmin: { Authorization: string };
  let authColaborador: { Authorization: string };
  let authOtherEmpresaAdmin: { Authorization: string };

  beforeAll(async () => {
    ({ app } = await createTestApp());
    api = request(app.getHttpServer());

    await api.post('/api/auth/register').send({
      nome: 'Admin', email: 'admin.dash@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa Dash',
    });
    const adminLogin = await api.post('/api/auth/login').send({ email: 'admin.dash@empresa.com', senha: 'senhaForte123' });
    authAdmin = { Authorization: `Bearer ${adminLogin.body.access_token}` };

    await api.post('/api/usuarios').set(authAdmin).send({
      nome: 'Colaborador', email: 'colab.dash@empresa.com', senha: 'senhaForte123', perfil: 'COLABORADOR',
    });
    const colabLogin = await api.post('/api/auth/login').send({ email: 'colab.dash@empresa.com', senha: 'senhaForte123' });
    authColaborador = { Authorization: `Bearer ${colabLogin.body.access_token}` };

    await api.post('/api/auth/register').send({
      nome: 'Admin Outra', email: 'admin.dash.outra@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa Dash Outra',
    });
    const otherLogin = await api.post('/api/auth/login').send({ email: 'admin.dash.outra@empresa.com', senha: 'senhaForte123' });
    authOtherEmpresaAdmin = { Authorization: `Bearer ${otherLogin.body.access_token}` };

    const checklist = await api.post('/api/checklists').set(authAdmin).send({ titulo: 'Checklist Dash', periodicidade: 'DIARIO' });
    await api.post(`/api/checklists/${checklist.body.id}/itens`).set(authAdmin).send({ descricao: 'Item', obrigatorio: true });
    await api.post(`/api/execucoes/checklists/${checklist.body.id}`).set(authColaborador);
  });

  afterAll(async () => {
    await app.close();
  });

  it(
    'regression: admin dashboard metrics are real numbers end-to-end over HTTP/JSON, ' +
      'not the empty objects the old $transaction(async cb => [...]) bug produced',
    async () => {
      const res = await api.get('/api/dashboard/admin').set(authAdmin);
      expect(res.status).toBe(200);
      const m = res.body.metricas;
      for (const key of [
        'usuariosAtivos', 'checklistsAtivos', 'execucoes', 'execucoesConcluidas',
        'execucoesEmAndamento', 'execucoesCanceladas', 'tarefasPendentes', 'mediaConclusao',
      ]) {
        expect(typeof m[key]).toBe('number');
      }
      expect(m.execucoes).toBeGreaterThanOrEqual(1);
      expect(res.body.execucoesUltimosDias).toHaveLength(7);
    },
  );

  it('admin dashboard never includes another empresa\'s executions in its counts', async () => {
    const before = (await api.get('/api/dashboard/admin').set(authAdmin)).body.metricas.execucoes;

    const otherChecklist = await api.post('/api/checklists').set(authOtherEmpresaAdmin).send({ titulo: 'Outra empresa', periodicidade: 'DIARIO' });
    await api.post(`/api/checklists/${otherChecklist.body.id}/itens`).set(authOtherEmpresaAdmin).send({ descricao: 'Item', obrigatorio: true });
    await api.post(`/api/execucoes/checklists/${otherChecklist.body.id}`).set(authOtherEmpresaAdmin);

    const after = (await api.get('/api/dashboard/admin').set(authAdmin)).body.metricas.execucoes;
    expect(after).toBe(before);
  });

  it('colaborador dashboard reflects only their own executions, not the whole company', async () => {
    await api.post('/api/usuarios').set(authAdmin).send({
      nome: 'Colaborador Inativo Nas Execucoes', email: 'colab.dash.sem@empresa.com', senha: 'senhaForte123', perfil: 'COLABORADOR',
    });
    const semExecucoesLogin = await api.post('/api/auth/login').send({ email: 'colab.dash.sem@empresa.com', senha: 'senhaForte123' });

    const res = await api.get('/api/dashboard/colaborador').set({ Authorization: `Bearer ${semExecucoesLogin.body.access_token}` });
    expect(res.status).toBe(200);
    expect(res.body.metricas.totalExecucoes).toBe(0);

    const colabRes = await api.get('/api/dashboard/colaborador').set(authColaborador);
    expect(colabRes.body.metricas.totalExecucoes).toBeGreaterThanOrEqual(1);
  });

  it('GET /dashboard dispatches to the right shape based on the caller role', async () => {
    const adminRes = await api.get('/api/dashboard').set(authAdmin);
    const colabRes = await api.get('/api/dashboard').set(authColaborador);
    expect(adminRes.body.perfil).toBe('ADMIN');
    expect(colabRes.body.perfil).toBe('COLABORADOR');
  });
});
