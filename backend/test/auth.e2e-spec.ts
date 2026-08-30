import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './support/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let api: ReturnType<typeof request>;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    api = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates an empresa and an ADMIN user, returning no password field', async () => {
      const res = await api.post('/api/auth/register').send({
        nome: 'Ana Admin',
        email: 'ana.register@empresa.com',
        senha: 'senhaForte123',
        nomeEmpresa: 'Empresa Registro',
      });

      expect(res.status).toBe(201);
      expect(res.body.empresa).toMatchObject({ nome: 'Empresa Registro' });
      expect(res.body.usuario).toMatchObject({ email: 'ana.register@empresa.com', perfil: 'ADMIN' });
      expect(Object.keys(res.body.usuario)).not.toContain('senha');
      expect(Object.keys(res.body.usuario)).not.toContain('senhaHash');
    });

    it('rejects a duplicate email (not a raw 500)', async () => {
      await api.post('/api/auth/register').send({
        nome: 'X', email: 'dup@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa Dup',
      });
      const res = await api.post('/api/auth/register').send({
        nome: 'Y', email: 'dup@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Outra Empresa',
      });
      expect([400, 409]).toContain(res.status);
    });

    it('rejects invalid email and short password (400)', async () => {
      const res = await api.post('/api/auth/register').send({
        nome: 'X', email: 'not-an-email', senha: '123', nomeEmpresa: 'Empresa Invalida',
      });
      expect(res.status).toBe(400);
    });

    it('rejects unknown extra fields (forbidNonWhitelisted)', async () => {
      const res = await api.post('/api/auth/register').send({
        nome: 'X', email: 'extra.fields@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa X', isAdmin: true,
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      await api.post('/api/auth/register').send({
        nome: 'Login User', email: 'login.user@empresa.com', senha: 'senhaForte123', nomeEmpresa: 'Empresa Login',
      });
    });

    it('returns an access_token for correct credentials', async () => {
      const res = await api.post('/api/auth/login').send({ email: 'login.user@empresa.com', senha: 'senhaForte123' });
      expect(res.status).toBe(201);
      expect(typeof res.body.access_token).toBe('string');
      expect(res.body.access_token.length).toBeGreaterThan(10);
    });

    it('rejects a wrong password with 401', async () => {
      const res = await api.post('/api/auth/login').send({ email: 'login.user@empresa.com', senha: 'errada' });
      expect(res.status).toBe(401);
    });

    it('gives the exact same 401 message for a nonexistent email as for a wrong password (no user enumeration)', async () => {
      const wrongPass = await api.post('/api/auth/login').send({ email: 'login.user@empresa.com', senha: 'errada' });
      const noSuchUser = await api.post('/api/auth/login').send({ email: 'ninguem.aqui@empresa.com', senha: 'errada' });
      expect(noSuchUser.status).toBe(401);
      expect(noSuchUser.body.message).toBe(wrongPass.body.message);
    });

    it('rejects an inactive user even with the correct password', async () => {
      const adminLogin = await api.post('/api/auth/login').send({ email: 'login.user@empresa.com', senha: 'senhaForte123' });
      const auth = { Authorization: `Bearer ${adminLogin.body.access_token}` };

      const created = await api.post('/api/usuarios').set(auth).send({
        nome: 'Sera Desativado', email: 'sera.desativado@empresa.com', senha: 'senhaForte123', perfil: 'COLABORADOR',
      });
      await api.patch(`/api/usuarios/${created.body.id}/status`).set(auth).send({ ativo: false });

      const res = await api.post('/api/auth/login').send({ email: 'sera.desativado@empresa.com', senha: 'senhaForte123' });
      expect(res.status).toBe(401);
    });
  });

  describe('protected routes without a valid token', () => {
    it('rejects a request with no Authorization header (401)', async () => {
      const res = await api.get('/api/checklists');
      expect(res.status).toBe(401);
    });

    it('rejects a request with a garbage/invalid token (401)', async () => {
      const res = await api.get('/api/checklists').set('Authorization', 'Bearer garbage.not.a.jwt');
      expect(res.status).toBe(401);
    });
  });
});
