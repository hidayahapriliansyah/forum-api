const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const ThreadCommentRepositoryPostgres = require('../ThreadCommentRepositoryPostgres');
const CreateThreadComment = require('../../../Domains/thread-comments/entities/CreateThreadComment');
const CreatedThreadComment = require('../../../Domains/thread-comments/entities/CreatedThreadComment');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const ForbiddenError = require('../../../Commons/exceptions/ForbiddenError');

describe('ThreadCommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await ThreadCommentRepliesTableTestHelper.cleanTable();
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterEach(async () => {
    await ThreadCommentRepliesTableTestHelper.cleanTable();
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('addComment', () => {
    it('should add comment to thread correctly', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId });

      const createThreadComment = new CreateThreadComment({
        content: 'Comment content test'
      });

      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentRepositoryPostgres =
        new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedThreadComment = await threadCommentRepositoryPostgres
        .addComment(userId, threadId, createThreadComment);

      expect(addedThreadComment).toStrictEqual(new CreatedThreadComment({
        id: 'thread-comment-123-aBcD',
        content: 'Comment content test',
        owner: 'hidayah'
      }));

      const commentOnDb = await ThreadCommentsTableTestHelper.findCommentById('thread-comment-123-aBcD');
      expect(commentOnDb).not.toBeNull();
    });
  });

  describe('softDeleteCommentById', () => {
    it('should soft delete comment from thread correctly', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId });

      const threadCommentId = await ThreadCommentsTableTestHelper.addComment({
        id: 'thread-comment-1',
        userId,
        threadId,
      });

      expect(threadCommentId).toBeDefined();

      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentRepositoryPostgres =
        new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      // action of comment soft delete repository
      await threadCommentRepositoryPostgres.softDeleteCommentById(threadCommentId);

      const deletedComment = await ThreadCommentsTableTestHelper.findCommentById(threadCommentId);

      expect(deletedComment.id).toBe(threadCommentId)
      expect(deletedComment.deleted_at).not.toBeNull();
      expect(deletedComment.is_delete).toBe(true);
    });
  });

  describe('findCommentById', () => {
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123'});
      const threadId = await ThreadsTableTestHelper.addThread({ id: 'thread-123', userId });
      await ThreadCommentsTableTestHelper.addComment({ id: 'comment-123', userId, threadId, });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
      await ThreadCommentsTableTestHelper.cleanTable();
    });

    it('should find comment correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      const notExistComment = await threadCommentRepositoryPostgres.findCommentById('not-found-comment-id');
      expect(notExistComment).toBeNull();

      const existComment = await threadCommentRepositoryPostgres.findCommentById('comment-123');
      expect(Object.keys(existComment).length).toBe(7);
      expect(existComment.id).toBe('comment-123');
      expect(existComment.created_at).toBeDefined();
      expect(existComment.is_delete).toBe(false);
      expect(existComment.deleted_at).toBe(null);
      expect(existComment.content).toBe('Content Test');
      expect(existComment.user_id).toBe('user-123');
      expect(existComment.thread_id).toBe('thread-123');
    });
  });

  describe('getCommentsWithUserFromThread', () => { 
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'username123',
        fullname: 'Fullname Test'
      });
      const threadId = await ThreadsTableTestHelper.addThread({ id: 'thread-123', userId });
      await ThreadCommentsTableTestHelper.addComment({
        id: 'comment-123',
        userId,
        threadId,
        content: 'Test content',
      });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
      await ThreadCommentsTableTestHelper.cleanTable();
    });

    it('should get comment with user correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      const comments = await threadCommentRepositoryPostgres.getCommentsWithUserFromThread('thread-123');

      const comment = comments[0];

      expect(comments).toStrictEqual([
        expect.objectContaining({
          id: 'comment-123',
          created_at: expect.any(Date),
          is_delete: false,
          deleted_at: null,
          content: 'Test content',
          user_id: 'user-123',
          thread_id: 'thread-123',
          username: 'username123',
          fullname: 'Fullname Test'
        }),
      ]);
    });
  });

  describe('verifyCommentExistAndOwnedByUser', () => {
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123'});
      const threadId = await ThreadsTableTestHelper.addThread({ id: 'thread-123', userId });
      await ThreadCommentsTableTestHelper.addComment({ id: 'comment-123', userId, threadId, });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
      await ThreadCommentsTableTestHelper.cleanTable();
    });

    it('should throw not found error if comment is not exist comment correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadCommentRepositoryPostgres
        .verifyCommentExistAndOwnedByUser('user-123', 'not-found-comment-id')
      ).rejects.toThrow(NotFoundError);
    });

    it('should forbidden error if comment is not owned by user', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadCommentRepositoryPostgres.verifyCommentExistAndOwnedByUser('user-12', 'comment-123'))
        .rejects.toThrow(ForbiddenError);
    });

    it('should return promise resolve if user id and comment id is correct', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadCommentRepositoryPostgres.verifyCommentExistAndOwnedByUser('user-123', 'comment-123'))
        .resolves.not.toThrow();
    })
  });

  describe('verifyCommentExist', () => {
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123'});
      const threadId = await ThreadsTableTestHelper.addThread({ id: 'thread-123', userId });
      await ThreadCommentsTableTestHelper.addComment({ id: 'comment-123', userId, threadId, });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
      await ThreadCommentsTableTestHelper.cleanTable();
    });

    it('should throw not found error if comment is not exist comment correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadCommentRepositoryPostgres.verifyCommentExist('not-found-comment-id'))
        .rejects.toThrow(NotFoundError);
    });

    it('should return promise resolve if comment exist', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadCommentRepositoryPostgres.verifyCommentExist('comment-123'))
        .resolves.not.toThrow();
    })
  });
});