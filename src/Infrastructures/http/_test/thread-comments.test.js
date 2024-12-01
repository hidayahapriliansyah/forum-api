const Jwt = require('@hapi/jwt');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');
const JwtTokenManager = require('../../security/JwtTokenManager');

describe('/thread/{threadId}/comments e2e', () => {
  const jwtTokenManager = new JwtTokenManager(Jwt.token);

  afterAll(async () => {
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    await pool.end();
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

  describe('when POST /threads/{threadId}/comments', () => {      
    it('should error if not sending auth header property', async () => {
      const server = await createServer(container);

      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const requestPayload = {
        title: 'title test',
        body: 'body test',
      };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(401);
      expect(responseJson.error).toBe('Unauthorized');
      expect(responseJson.message).toBe('Missing authentication');
    });

    it('should error if not sending if wrong access token', async () => {
      const server = await createServer(container);

      const accessToken = 'random access token';
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const requestPayload = {
        title: 'title test',
        body: 'body test',
      };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
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
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const requestPayload = {};

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada');
    });

    it('should error if data type propery body request is wrong', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const requestPayload = { content: 10 };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('tidak dapat membuat comment baru karena tipe data tidak sesuai');
    });

    it('should error if thread is not found', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const threadId = 'not_found';
      const requestPayload = { content: 'content test' };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`,
        }
      })

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toBe(404);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Thread tidak ditemukan.');
    });

    it('should correctly create thread commment and return correct response', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const requestPayload = { content: 'content test' };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`,
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(201);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('success');
      expect(Object.keys(responseJson.data)).toHaveLength(1);
      expect(Object.keys(responseJson.data.addedComment)).toHaveLength(3);
      expect(responseJson.data.addedComment.id).toBeDefined();
      expect(responseJson.data.addedComment.content).toBe('content test');
      expect(responseJson.data.addedComment.owner).toBeDefined();

      // cek di database harus sudah ada 1 thread
      const thread = await ThreadsTableTestHelper.findOne();
      expect(thread).not.toBeNull();
    });
  });

  describe('DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should error if not sending auth header property', async () => {
      const server = await createServer(container);

      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}`
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(401);
      expect(responseJson.statusCode).toBe(401);
      expect(responseJson.error).toBe('Unauthorized');
      expect(responseJson.message).toBe('Missing authentication');
    });

    it('should error if not sending wrong access token', async () => {
      const server = await createServer(container);

      const accessToken = 'random access token';
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(401);
      expect(responseJson.statusCode).toBe(401);
      expect(responseJson.error).toBe('Unauthorized');
      expect(responseJson.message).toBe('Bad HTTP authentication header format');
    });

    it('should error if thread is not found', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const threadId = 'not_found';
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(404);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Thread tidak ditemukan.');
    });

    it('should error notfound if comment is owned by user', async () => {
      const server = await createServer(container);

      const newUserIdWithoutComment = await UsersTableTestHelper.addUser({ 
        id: 'new-userId',
        username: 'new-test_username',
        password: 'new-testpw',
      });

      const accessToken = await jwtTokenManager.createAccessToken({ id: newUserIdWithoutComment });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(404);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Comment tidak ditemukan.');
    });

    it('should error not found if comment is not exist', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const threadCommentId = 'not_found-commentId';

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(404);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Comment tidak ditemukan.');
    });

    it('should correctly soft delete thread comment and return correct response', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(200);
      expect(Object.keys(responseJson)).toHaveLength(1);
      expect(responseJson.status).toBe('success');

      const threadCommentOnDb = await ThreadCommentsTableTestHelper.findOne();
      expect(threadCommentOnDb.is_delete).toBe(true);
    })
  });
});