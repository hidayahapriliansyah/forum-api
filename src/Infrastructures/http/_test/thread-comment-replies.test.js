const Jwt = require('@hapi/jwt');
const JwtTokenManager = require('../../security/JwtTokenManager');
const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');
const container = require('../../container');
const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');

describe('/threads/{threadId}/comments/{commentId}/replies endpoint', () => {
  const jwtTokenManager = new JwtTokenManager(Jwt.token);

  afterAll(async () => {
    await ThreadCommentRepliesTableTestHelper.cleanTable();
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

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {      
    it('should error if not sending auth header property', async () => {
      const server = await createServer(container);

      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const requestPayload = {};

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies`,
        payload: requestPayload,
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(401);
      expect(responseJson.statusCode).toBe(401);
      expect(responseJson.error).toBe('Unauthorized');
      expect(responseJson.message).toBe('Missing authentication');
    });

    it('should error if not sending if wrong access token', async () => {
      const server = await createServer(container);

      const accessToken = 'random access token';
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const requestPayload = {
        content: 'content test',
      };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies`,
        payload: requestPayload,
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

    it('should error if required propery body request is missing', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const requestPayload = {};

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('tidak dapat membuat reply baru karena properti yang dibutuhkan tidak ada');
    });

    it('should error if data type propery body request is wrong', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const requestPayload = { content: 10 };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(400);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('tidak dapat membuat reply baru karena tipe data tidak sesuai');
    });

    it('should error 404 if thread is not found', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const threadId = 'not_found';
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const requestPayload = { content: 'content test' };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies`,
        payload: requestPayload,
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

    it('should error 404 if comment is not found', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const threadCommentId = 'not_found_comment';
      const requestPayload = { content: 'content test' };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies`,
        payload: requestPayload,
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

    it('should correctly create thread commment reply and return correct response', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const requestPayload = { content: 'content test' };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies`,
        payload: requestPayload,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(201);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('success');
      expect(Object.keys(responseJson.data)).toHaveLength(1);
      expect(Object.keys(responseJson.data.addedReply)).toHaveLength(3);
      expect(responseJson.data.addedReply.id).toBeDefined();
      expect(responseJson.data.addedReply.content).toBe('content test');
      expect(responseJson.data.addedReply.owner).toBeDefined();

      const threadCommentReply = await ThreadCommentRepliesTableTestHelper.findOne();
      expect(threadCommentReply).not.toBeNull();
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should error if not sending auth header property', async () => {
      const server = await createServer(container);

      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const { id: threadCommentReplyId } = await ThreadCommentRepliesTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies/${threadCommentReplyId}`,
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
      const { id: threadCommentReplyId } = await ThreadCommentRepliesTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies/${threadCommentReplyId}`,
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
      const { id: threadCommentReplyId } = await ThreadCommentRepliesTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies/${threadCommentReplyId}`,
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

    it('should error if comment is not found', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const threadCommentId = 'not_found';
      const { id: threadCommentReplyId } = await ThreadCommentRepliesTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies/${threadCommentReplyId}`,
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

    it('should error notfound if comment reply is not owned by user', async () => {
      const server = await createServer(container);

      const newUserIdWithoutCommentReply = await UsersTableTestHelper.addUser({ 
        id: 'new-userId',
        username: 'new-test_username',
        password: 'new-testpw',
      });

      const accessToken = await jwtTokenManager.createAccessToken({ id: newUserIdWithoutCommentReply });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const { id: threadCommentReplyId } = await ThreadCommentRepliesTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies/${threadCommentReplyId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(403);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Forbidden');
    });

    it('should error not found if comment reply is not exist', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const threadCommentReplyId = 'not_found-comment-replyId';

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies/${threadCommentReplyId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(404);
      expect(Object.keys(responseJson)).toHaveLength(2);
      expect(responseJson.status).toBe('fail');
      expect(responseJson.message).toBe('Reply tidak ditemukan.');
    });

    it('should correctly soft delete thread comment reply and return correct response', async () => {
      const server = await createServer(container);

      const { id: userId } = await UsersTableTestHelper.findOne();
      const accessToken = await jwtTokenManager.createAccessToken({ id: userId });
      const { id: threadId } = await ThreadsTableTestHelper.findOne();
      const { id: threadCommentId } = await ThreadCommentsTableTestHelper.findOne();
      const { id: threadCommentReplyId } = await ThreadCommentRepliesTableTestHelper.findOne();

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${threadCommentId}/replies/${threadCommentReplyId}`,
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toBe(200);
      expect(Object.keys(responseJson)).toHaveLength(1);
      expect(responseJson.status).toBe('success');

      const threadCommentReplyOnDb = await ThreadCommentRepliesTableTestHelper.findOne();
      expect(threadCommentReplyOnDb.is_delete).toBe(true);
    })
  });
});