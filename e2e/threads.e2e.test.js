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

  describe('GET /threads', () => {
    beforeEach(async () => {
      // create thread with comment and reply
      const userIdA = await UsersTableTestHelper.addUser({ id: 'id-user-a', username: 'user_a' });
      const userIdB = await UsersTableTestHelper.addUser({ id: 'id-user-b', username: 'user_b' });
      const userIdC = await UsersTableTestHelper.addUser({ id: 'id-user-c', username: 'user_c' });

      const threadId = await ThreadsTableTestHelper.addThread({ userId: userIdA });

      const threadCommentBId = await ThreadCommentsTableTestHelper.addComment({
        id: 'thread-comment-2',
        userId: userIdB,
        threadId,
      });
      const threadCommentAId = await ThreadCommentsTableTestHelper.addComment({
        id: 'thread-comment-1',
        userId: userIdB,
        threadId,
      });

      const replyId1 = await ThreadCommentRepliesTableTestHelper.addReply({
        id: 'thread-comment-reply-2',
        userId: userIdC,
        threadCommentId: threadCommentAId,
      });
      await ThreadCommentRepliesTableTestHelper.addReply({
        id: 'thread-comment-reply-1',
        userId: userIdC,
        threadCommentId: threadCommentAId,
      });

      // soft delete a comment
      await ThreadCommentsTableTestHelper.softDeleteById(threadCommentBId);
      // soft delete a reply
      await ThreadCommentRepliesTableTestHelper.softDeleteById(replyId1);
    });

    afterEach(async () => {
      // delete thread comment reply
      await ThreadsTableTestHelper.cleanTable();
      await UsersTableTestHelper.cleanTable();
      await ThreadCommentsTableTestHelper.cleanTable();
      await ThreadCommentRepliesTableTestHelper.cleanTable();
    });

    // should return error not found if thread is not found
    it('should return error not found if thread is not found', async () => {
      const threadId = 'notfound-threadid';

      const response = await supertest(server.listener)
        .get(`/threads/${threadId}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('tidak dapat menemukan thread');
    });

    // should return thread correctly
    it('should return thread correctly', async () => {
      const { id: threadId } = await ThreadsTableTestHelper.findOne();

      const response = await supertest(server.listener)
        .get(`/threads/${threadId}`);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body).length).toBe(2);
      expect(response.body.status).toBe('success');
      expect(response.body.data.thread.id).toBe(threadId);
      expect(response.body.data.thread.title).toBeDefined();
      expect(response.body.data.thread.body).toBeDefined();
      expect(response.body.data.thread.date).toBeDefined();
      expect(response.body.data.thread.username).toBeDefined();
      expect(response.body.data.thread.comments.length).toBe(2);
      expect(response.body.data.thread.comments[0].id).toBe('thread-comment-2');
      expect(response.body.data.thread.comments[0].username).toBeDefined();
      expect(response.body.data.thread.comments[0].date).toBeDefined();
      expect(response.body.data.thread.comments[0].content).toBeDefined();
      expect(response.body.data.thread.comments[0].replies.length).toBe(0);
      expect(response.body.data.thread.comments[0].content).toBe("**komentar telah dihapus**");
      expect(response.body.data.thread.comments[1].replies.length).toBe(2);
      expect(response.body.data.thread.comments[1].replies[0].id).toBe('thread-comment-reply-2');
      expect(response.body.data.thread.comments[1].replies[0].username).toBeDefined();
      expect(response.body.data.thread.comments[1].replies[0].date).toBeDefined();
      expect(response.body.data.thread.comments[1].replies[0].content).toBeDefined();
      expect(response.body.data.thread.comments[1].replies[0].content).toBe("**balasan telah dihapus**");
    });
  });
});