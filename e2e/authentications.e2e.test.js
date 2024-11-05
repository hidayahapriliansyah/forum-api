const supertest = require('supertest');
const container = require('../src/Infrastructures/container');
const createServer = require('../src/Infrastructures/http/createServer');
const { closePool } = require('../tests/PoolUtils');
const UsersTableTestHelper = require('../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../tests/AuthenticationsTableTestHelper');
const JwtTokenManager = require('../src/Infrastructures/security/JwtTokenManager');
const Jwt = require('@hapi/jwt');

describe('Authtentications E2E', () => {
  let server;

  beforeAll(async () => {
    server = await createServer(container);
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
    await closePool();
  });

  beforeEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('POST /authentications', () => {
    beforeEach(async () => {
      await UsersTableTestHelper.addUser({
        username: 'test_username',
        password: 'test_password'
      });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
    });

    it('should error if payload is not proper', async () => { 
      const response = await supertest(server.listener)
      .post('/authentications')
      .send({
        username: true,
        password: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('username dan password harus string');
    });

    it('should error if payload have no needed propery', async () => { 
      const response = await supertest(server.listener)
        .post('/authentications')
        .send({
          username: 'username_test',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('harus mengirimkan username dan password');
    });

    it('should error if username not found', async () => {
      const response = await supertest(server.listener)
        .post('/authentications')
        .send({
          username: 'username gak ada bro',
          password: 'gak ada ngaco',
        });

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('username tidak ditemukan');
    });

    it('should error if wrong password', async () => {
      const response = await supertest(server.listener)
        .post('/authentications')
        .send({
          username: 'test_username',
          password: 'gak ada ngaco',
        });

      expect(response.status).toBe(401);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('kredensial yang Anda masukkan salah');
    });

    it('should return login data correctly', async () => {
      const response = await supertest(server.listener)
        .post('/authentications')
        .send({
          username: 'test_username',
          password: 'test_password',
        });

      expect(response.status).toBe(201);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('success');
      expect(Object.keys(response.body.data)).toHaveLength(2);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(typeof response.body.data.refreshToken).toBe('string');

      const dbAuthToken = await AuthenticationsTableTestHelper.findToken(response.body.data.refreshToken);
      expect(dbAuthToken[0].token).toBe(response.body.data.refreshToken);
    });
  });

  describe('PUT /authentications', () => {
    it('should error if payload not contain needed property', async () => {
      const response = await supertest(server.listener)
        .put('/authentications')
        .send({});

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('harus mengirimkan token refresh');
    });

    it('should error if payload type is unmatch', async () => {
      const response = await supertest(server.listener)
        .put('/authentications')
        .send({
          refreshToken: [],
        });

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('refresh token harus string');
    });

    it('should error if refresh token payload is not valid decoded', async () => {
      const refreshToken = 'randomstring';
      const response = await supertest(server.listener)
        .put('/authentications')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('refresh token tidak valid');
    });

    it('should error if refresh token is not registered on db', async () => {
      const jwtTokenManager = new JwtTokenManager(Jwt.token);
      const refreshToken = await jwtTokenManager.createRefreshToken('hellobang');

      const response = await supertest(server.listener)
        .put('/authentications')
        .send({
          refreshToken,
        });

      const isTableAuthEmpty = await AuthenticationsTableTestHelper.checkIsTableEmpty();
      expect(isTableAuthEmpty).toBe(true);

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('refresh token tidak ditemukan di database');
    });

    it('should return new token correctly', async () => {
      await UsersTableTestHelper.addUser({
        username: 'test_username',
        password: 'test_password'
      });

      // login dulu
      const responseLogin = await supertest(server.listener)
        .post('/authentications')
        .send({
          username: 'test_username',
          password: 'test_password',
        });

      const { refreshToken } = responseLogin.body.data;

      const responseRefreshToken = await supertest(server.listener)
        .put('/authentications')
        .send({
          refreshToken,
        });

      expect(responseRefreshToken.status).toBe(200);
      expect(Object.keys(responseRefreshToken.body)).toHaveLength(2);
      expect(responseRefreshToken.body.status).toBe('success');
      expect(Object.keys(responseRefreshToken.body.data)).toHaveLength(1);
      expect(typeof responseRefreshToken.body.data.accessToken).toBe('string');
    });
  });
  // mirip kayak up date gak sih
  describe('DELETE /authentications', () => {
    it('should error if payload not contain needed property', async () => {
      const response = await supertest(server.listener)
        .delete('/authentications')
        .send({});

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('harus mengirimkan token refresh');
    });

    it('should error if payload type is unmatch', async () => {
      const response = await supertest(server.listener)
        .delete('/authentications')
        .send({
          refreshToken: [],
        });

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('refresh token harus string');
    });

    it('should error if refresh token payload is not registered on db', async () => {
      const refreshToken = 'randomstring';
      const response = await supertest(server.listener)
        .delete('/authentications')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(400);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('refresh token tidak ditemukan di database');
    });

    it('should delete token correctly', async () => {
      await UsersTableTestHelper.addUser({
        username: 'test_username',
        password: 'test_password'
      });

      // login dulu
      const responseLogin = await supertest(server.listener)
        .post('/authentications')
        .send({
          username: 'test_username',
          password: 'test_password',
        });

      const { refreshToken } = responseLogin.body.data;

      const responseLogout = await supertest(server.listener)
        .delete('/authentications')
        .send({
          refreshToken,
        });

      const isTableAuthEmpty = await AuthenticationsTableTestHelper.checkIsTableEmpty();
      expect(isTableAuthEmpty).toBe(true);

      expect(responseLogout.status).toBe(200);
      expect(Object.keys(responseLogout.body)).toHaveLength(1);
      expect(responseLogout.body.status).toBe('success');
    });
  });
});