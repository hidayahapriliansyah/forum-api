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
    await ThreadCommentRepliesTableTestHelper.cleanTable();
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
    const threadCommentId = await ThreadCommentsTableTestHelper
      .addComment({ userId, threadId, id: 'thread-commentid-dummy' });
    await ThreadCommentRepliesTableTestHelper.addReply({ 
      userId,
      threadCommentId,
      content: 'thread comment reply id dummy'
    });
  });

  afterEach(async () => {
    await ThreadCommentRepliesTableTestHelper.cleanTable();
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('POST /threads/{threadId}/comments/{commentId}/replies', () => {      
    it('should error if not sending auth header property', async () => {
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments/${threadCommentId}/replies`)
        .send({
          content: 'content test',
        });

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Missing authentication');
    });

    it('should error if not sending if wrong access token', async () => {
      const accessToken = 'random access token';
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments/${threadCommentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'content test',
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
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments/${threadCommentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('tidak dapat membuat reply baru karena properti yang dibutuhkan tidak ada');
    });

    it('should error if data type propery body request is wrong', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments/${threadCommentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 10 });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('fail');
        expect(response.body.message).toBe('tidak dapat membuat reply baru karena tipe data tidak sesuai');
    });

    it('should error 404 if thread is not found', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const threadId = 'not_found';
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments/${threadCommentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'content test' });

      expect(response.status).toBe(404);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Thread tidak ditemukan.');
    });

    it('should error 404 if comment is not found', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const threadCommentId = 'not_found_comment';

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments/${threadCommentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'content test' });

      expect(response.status).toBe(404);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Comment tidak ditemukan.');
    });

    it('should correctly create thread commment reply and return correct response', async () => {
      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .post(`/threads/${threadId}/comments/${threadCommentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'content test' });

      expect(response.status).toBe(201);
      expect(Object.keys(response.body)).toHaveLength(2);
      expect(response.body.status).toBe('success');
      expect(Object.keys(response.body.data)).toHaveLength(1);
      expect(Object.keys(response.body.data.addedReply)).toHaveLength(3);
      expect(response.body.data.addedReply.id).toBeDefined();
      expect(response.body.data.addedReply.content).toBe('content test');
      expect(response.body.data.addedReply.owner).toBeDefined();

      const threadCommentReply = await ThreadCommentRepliesTableTestHelper.findOne();
      expect(threadCommentReply).not.toBeNull();
    });
  });
});