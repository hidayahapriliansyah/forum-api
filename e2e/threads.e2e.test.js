const supertest = require('supertest');
const container = require('../src/Infrastructures/container');
const createServer = require('../src/Infrastructures/http/createServer');
const JwtTokenManager = require('../src/Infrastructures/security/JwtTokenManager');
const { closePool } = require('../tests/PoolUtils');
const UsersTableTestHelper = require('../tests/UsersTableTestHelper');
const Jwt = require('@hapi/jwt');
const ThreadsTableTestHelper = require('../tests/ThreadsTableTestHelper');

describe('threads e2e', () => {
  const jwtTokenManager = new JwtTokenManager(Jwt.token);

  let server;

  beforeAll(async () => {
    server = await createServer(container);
    await server.start();
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    await server.stop();
    await closePool();
  });

  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ 
      id: 'userId',
      username: 'test_username',
      password: 'testpw',
    });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('POST /threads', () => {
    // should error if not sending auth header property
    it('should error if not sending auth header property', async () => {
      const response = await supertest(server.listener)
        .post('/threads')
        .send({
          title: 'title test',
          body: 'body test',
        });

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Missing authentication');
    });

    it('should error if not sending if wrong access token', async () => {
      const accessToken = 'random access token';

      const response = await supertest(server.listener)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'title test',
          body: 'body test',
        });

      expect(response.body.statusCode).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Bad HTTP authentication header format');
      expect(response.status).toBe(401);
    });

    it('should error if required propery body request is missing', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });

      const response = await supertest(server.listener)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'title test',
        });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.message).toBe('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should error if data type propery body request is wrong', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });

      const response = await supertest(server.listener)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 10,
          body: true,
        });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.message).toBe('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });

    it('should correctly create threads and return correct response', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });

      const response = await supertest(server.listener)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'title test',
          body: 'body test',
        });

      expect(response.status).toBe(201);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('success');
      expect(Object.keys(response.body.data)).toHaveLength(1);
      expect(Object.keys(response.body.data.addedThread)).toHaveLength(3);
      expect(response.body.data.addedThread.id).toBeDefined();
      expect(response.body.data.addedThread.title).toBe('title test');
      expect(response.body.data.addedThread.owner).toBeDefined();

      // cek di database harus sudah ada 1 thread
      const thread = await ThreadsTableTestHelper.findOne();
      expect(thread).not.toBeNull();
    });
  })
});