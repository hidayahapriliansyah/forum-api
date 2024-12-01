const container = require('../../container');
const createServer = require('../createServer');
const pool = require('../../database/postgres/pool');
const JwtTokenManager = require('../../security/JwtTokenManager');
const Jwt = require('@hapi/jwt');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const { server } = require('@hapi/hapi');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');

describe('/threads endpoint', () => {
  const jwtTokenManager = new JwtTokenManager(Jwt.token);

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    await pool.end();
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

  describe('when POST /threads', () => {
    // should error if not sending auth header property
    it('should error if not sending auth header property', async () => {
      const server = await createServer(container);

      const requestPayload = {
        title: 'title test',
        body: 'body test',
      }

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
      });

      const responseJson = JSON.parse(response.payload);

      expect(responseJson.statusCode).toBe(401);
      expect(responseJson.error).toBe('Unauthorized');
      expect(responseJson.message).toBe('Missing authentication');
    });

    it('should error if not sending if wrong access token', async () => {
      const accessToken = 'random access token';
      const server = await createServer(container);

      const requestPayload = {
        title: 'title test',
        body: 'body test',
      }

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`,
        }
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(401);
      expect(responseJson.error).toBe('Unauthorized');
      expect(responseJson.message).toBe('Bad HTTP authentication header format');
    });

    it('should error if required propery body request is missing', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });

      const requestPayload = {
        title: 'title test',
      }

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should error if data type propery body request is wrong', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const requestPayload = {
        title: 10,
        body: true,
      }

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });

    it('should correctly create threads and return correct response', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const requestPayload = {
        title: 'title test',
        body: 'body test',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(201);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('success');
      expect(Object.keys(responseJson.data)).toHaveLength(1);
      expect(Object.keys(responseJson.data.addedThread)).toHaveLength(3);
      expect(responseJson.data.addedThread.id).toBeDefined();
      expect(responseJson.data.addedThread.title).toBe('title test');
      expect(responseJson.data.addedThread.owner).toBeDefined();

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
      const server = await createServer(container);

      const threadId = 'notfound-threadid';

      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(404);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('tidak dapat menemukan thread');
    });

    // should return thread correctly
    it('should return thread correctly', async () => {
      const server = await createServer(container);
      const { id: threadId } = await ThreadsTableTestHelper.findOne();

      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toBe(200);
      expect(Object.keys(responseJson).length).toBe(2);
      expect(responseJson.status).toBe('success');
      expect(responseJson.data.thread.id).toBe(threadId);
      expect(responseJson.data.thread.title).toBeDefined();
      expect(responseJson.data.thread.body).toBeDefined();
      expect(responseJson.data.thread.date).toBeDefined();
      expect(responseJson.data.thread.username).toBeDefined();
      expect(responseJson.data.thread.comments.length).toBe(2);
      expect(responseJson.data.thread.comments[0].id).toBe('thread-comment-2');
      expect(responseJson.data.thread.comments[0].username).toBeDefined();
      expect(responseJson.data.thread.comments[0].date).toBeDefined();
      expect(responseJson.data.thread.comments[0].content).toBeDefined();
      expect(responseJson.data.thread.comments[0].replies.length).toBe(0);
      expect(responseJson.data.thread.comments[0].content).toBe("**komentar telah dihapus**");
      expect(responseJson.data.thread.comments[1].replies.length).toBe(2);
      expect(responseJson.data.thread.comments[1].replies[0].id).toBe('thread-comment-reply-2');
      expect(responseJson.data.thread.comments[1].replies[0].username).toBeDefined();
      expect(responseJson.data.thread.comments[1].replies[0].date).toBeDefined();
      expect(responseJson.data.thread.comments[1].replies[0].content).toBeDefined();
      expect(responseJson.data.thread.comments[1].replies[0].content).toBe("**balasan telah dihapus**");
    });
  });
});