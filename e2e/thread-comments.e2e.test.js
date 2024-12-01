const supertest = require('supertest');
const container = require('../src/Infrastructures/container');
const createServer = require('../src/Infrastructures/http/createServer');
const JwtTokenManager = require('../src/Infrastructures/security/JwtTokenManager');
const { closePool } = require('../tests/PoolUtils');
const UsersTableTestHelper = require('../tests/UsersTableTestHelper');
const Jwt = require('@hapi/jwt');
const ThreadsTableTestHelper = require('../tests/ThreadsTableTestHelper');
const ThreadCommentsTableTestHelper = require('../tests/ThreadCommentsTableTestHelper');
const ThreadCommentRepliesTableTestHelper = require('../tests/ThreadCommentRepliesTestHelper');

describe('thread comments e2e', () => {
  const jwtTokenManager = new JwtTokenManager(Jwt.token);

  let server;

  beforeAll(async () => {
    server = await createServer(container);
    await server.start();
  });

  afterAll(async () => {
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    await server.stop();
    await closePool();
  });

  beforeEach(async () => {
    const userId = await UsersTableTestHelper.addUser({ 
      id: 'userId',
      username: 'test_username',
      password: 'testpw',
    });

    const threadId = await ThreadsTableTestHelper.addThread({ userId, id: 'thread-id-dummy' });
    await ThreadCommentsTableTestHelper
      .addComment({ userId, threadId, id: 'thread-commentid-dummy' });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('POST /threads/{threadId}/comments', () => {      
    // should error if not sending auth header property
    it('should error if not sending auth header property', async () => {
      const { id: threadId } = await ThreadsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments`)
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
      const { id: threadId } = await ThreadsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments`)
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
      const { id: threadId } = await ThreadsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada');
    });

    it('should error if data type propery body request is wrong', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 10 });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.message).toBe('tidak dapat membuat comment baru karena tipe data tidak sesuai');
    });

    it('should error if thread is not found', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const threadId = 'not_found';

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'content test' });

      expect(response.status).toBe(404);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Thread tidak ditemukan.');

    });

    it('should correctly create thread commment and return correct response', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'content test' });

      expect(response.status).toBe(201);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('success');
      expect(Object.keys(response.body.data)).toHaveLength(1);
      expect(Object.keys(response.body.data.addedComment)).toHaveLength(3);
      expect(response.body.data.addedComment.id).toBeDefined();
      expect(response.body.data.addedComment.content).toBe('content test');
      expect(response.body.data.addedComment.owner).toBeDefined();

      // cek di database harus sudah ada 1 thread
      const thread = await ThreadsTableTestHelper.findOne();
      expect(thread).not.toBeNull();
    });
  });

  describe('DELETE /threads/{threadId}/comments/{commentId}', () => {
    // should error if not sending auth header property
    it('should error if not sending auth header property', async () => {
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .delete(`/threads/${threadId}/comments/${threadCommentId}`)

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Missing authentication');
    });

    it('should error if not sending wrong access token', async () => {
      const accessToken = 'random access token';
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .delete(`/threads/${threadId}/comments/${threadCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(response.body.statusCode).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Bad HTTP authentication header format');
      expect(response.status).toBe(401);
    });

    it('should error if thread is not found', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const threadId = 'not_found';
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .delete(`/threads/${threadId}/comments/${threadCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Thread tidak ditemukan.');
    });

    it('should error notfound if comment is owned by user', async () => {
      const newUserIdWithoutComment = await UsersTableTestHelper.addUser({ 
        id: 'new-userId',
        username: 'new-test_username',
        password: 'new-testpw',
      });

      const accessToken = await jwtTokenManager.createAccessToken({ id: newUserIdWithoutComment });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .delete(`/threads/${threadId}/comments/${threadCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Comment tidak ditemukan.');
    });

    it('should error not found if comment is not exist', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const threadCommentId = 'not_found-commentId';

      const response = await supertest(server.listener)
        .delete(`/threads/${threadId}/comments/${threadCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Comment tidak ditemukan.');
    });

    fit('should correctly soft delete thread comment and return correct response', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .delete(`/threads/${threadId}/comments/${threadCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toHaveLength(1);
      expect(response.body.status).toBe('success');

      const threadCommentOnDb = await ThreadCommentsTableTestHelper.findOne();
      expect(threadCommentOnDb.is_delete).toBe(true);
    })
  });
});