const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const ThreadCommentRepositoryPostgres = require('../ThreadCommentRepositoryPostgres');
const CreateThreadComment = require('../../../Domains/thread-comments/entities/CreateThreadComment');
const CreatedThreadComment = require('../../../Domains/thread-comments/entities/CreatedThreadComment');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

describe('ThreadCommentRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadCommentRepliesTableTestHelper.cleanTable();
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('addComment', () => {
    it('should throw not found error if thread does not exist', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const threadId = 'not-found';

      const fakeIdGenerator = () => '123-aBcD';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentRepositoryPostgres =
        new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator, threadRepositoryPostgres);

      const createThreadComment = new CreateThreadComment({
        content: 'Comment content test'
      });

      await expect(
        threadCommentRepositoryPostgres.addComment(userId, threadId, createThreadComment)
      ).rejects.toThrowError('Thread tidak ditemukan.');
    });

    it('should add comment to thread correctly', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId });

      const createThreadComment = new CreateThreadComment({
        content: 'Comment content test'
      });

      const fakeIdGenerator = () => '123-aBcD';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentRepositoryPostgres =
        new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator, threadRepositoryPostgres);

      const addedThreadComment = await threadCommentRepositoryPostgres
        .addComment(userId, threadId, createThreadComment);

      expect(addedThreadComment).toStrictEqual(new CreatedThreadComment({
        id: 'thread-comment-123-aBcD',
        content: 'Comment content test',
        owner: 'hidayah'
      }));
    });
  });

  describe('deleteComment', () => {
    it('should delete comment from thread correctly', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId });

      const threadCommentId = await ThreadCommentsTableTestHelper.addComment({
        id: 'thread-comment-1',
        userId,
        threadId,
      });

      expect(threadCommentId).toBeDefined();

      const fakeIdGenerator = () => '123-aBcD';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentRepositoryPostgres =
        new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator, threadRepositoryPostgres);

      const deletedCommentId = await threadCommentRepositoryPostgres.deleteCommentById(threadCommentId);

      const threadComment = await ThreadCommentsTableTestHelper.findCommentById(threadCommentId);

      expect(deletedCommentId).toBe(threadCommentId)
      expect(threadComment).toBeUndefined();
    });
  });

  it('should throw not found error if comment does not exist', async () => {
      const threadCommentId = 'not-exist';

      expect(threadCommentId).toBeDefined();

      const fakeIdGenerator = () => '123-aBcD';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentRepositoryPostgres =
        new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator, threadRepositoryPostgres);

      await expect(
        threadCommentRepositoryPostgres.deleteCommentById(threadCommentId)
      ).rejects.toThrowError('Comment tidak ditemukan.');
  });
});