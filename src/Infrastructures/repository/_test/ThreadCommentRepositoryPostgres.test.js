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
});