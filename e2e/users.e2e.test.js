const supertest = require('supertest');
const container = require('../src/Infrastructures/container');
const createServer = require('../src/Infrastructures/http/createServer');
const { closePool } = require('../tests/PoolUtils');
const UsersTableTestHelper = require('../tests/UsersTableTestHelper');

describe('Users E2E', () => {
  let server;

  beforeAll(async () => {
    server = await createServer(container);
    await server.start();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();

    await server.stop();
    await closePool();
  });

  describe('POST /users', () => {
    it('should create user correctly', async () => {
      const response = await supertest(server.listener)
        .post('/users')
        .send({
          username: 'username_user_test',
          password: 'secretpassword',
          fullname: 'User Fullname',
        });

      expect(response.status).toBe(201);
      expect(typeof response.body.data).toBe('object');
      expect(Object.keys(response.body.data)).toHaveLength(1);
      expect(response.body.data).toHaveProperty('addedUser');
      expect(response.body.data.addedUser.id).toBeDefined();
      expect(response.body.data.addedUser.username).toBe('username_user_test');
      expect(response.body.data.addedUser.fullname).toBe('User Fullname');
    });

    it('should error if send unmatch payload property', async () => {
      const response = await supertest(server.listener)
        .post('/users')
        .send({
          username: 'username_user_test',
          password: 'secretpassword',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada');
    });

    it('should error if payload typ property not proper', async () => {
      const response = await supertest(server.listener)
        .post('/users')
        .send({
          username: true,
          password: 0,
          fullname: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada');
    });
  });
});