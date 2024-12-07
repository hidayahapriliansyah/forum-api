const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const ThreadCommentRepositoryPostgres = require('../ThreadCommentRepositoryPostgres');
const ThreadCommentReplyRepositoryPostgres = require('../ThreadCommentReplyRepositoryPostgres');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');
const CreateThreadCommentReply = require('../../../Domains/thread-comment-replies/entities/CreateThreadCommentReply');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

describe('ThreadCommentReplyRepositoryPostgress', () => {
  afterEach(async () => {
    await ThreadCommentRepliesTableTestHelper.cleanTable();
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });
  // add
  describe('addReply', () => {
    it('should add reply to a comment correctly', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId });
      const commentId = await ThreadCommentsTableTestHelper.addComment({ userId, threadId });

      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentReplyRepositoryPostgres = new ThreadCommentReplyRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      const createThreadCommentReply = new CreateThreadCommentReply({
        content: 'Reply content test'
      });

      const reply = await threadCommentReplyRepositoryPostgres
        .addCommentReply(userId, commentId, createThreadCommentReply);

      expect(reply.id).toBe('thread-comment-reply-123-aBcD');
      expect(reply.content).toBe('Reply content test');
      expect(reply.owner).toBe('hidayah');
    });
  });

  describe('softDeleteCommentReply', () => {
    it('should correctly soft delete reply', async () => { 
      const userId = await UsersTableTestHelper.addUser({ id: 'user-test123', username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId })
      const commentId = await ThreadCommentsTableTestHelper.addComment({ userId, threadId });
      const replyId = await ThreadCommentRepliesTableTestHelper
        .addReply({ userId, threadCommentId: commentId });

      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentReplyRepositoryPostgres = new ThreadCommentReplyRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      await threadCommentReplyRepositoryPostgres
        .softDeleteCommentReplyById(replyId);

      const deletedReply = await ThreadCommentRepliesTableTestHelper.findReplyByid(replyId);
      expect(deletedReply.id).toBe(replyId);
      expect(deletedReply.deleted_at).not.toBeNull();
      expect(deletedReply.is_delete).toBe(true);
    });
  });

  describe('findReplyById', () => {
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123'});
      const threadId = await ThreadsTableTestHelper.addThread({ id: 'thread-123', userId });
      const commentId = await ThreadCommentsTableTestHelper.addComment({ id: 'comment-123', userId, threadId, });
      await ThreadCommentRepliesTableTestHelper.addReply({ id: 'reply-123', threadCommentId: commentId, userId });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
      await ThreadCommentsTableTestHelper.cleanTable();
      await ThreadCommentRepliesTableTestHelper.cleanTable();
    });

    it('should find comment correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadCommentReplyRepositoryPostgres =
        new ThreadCommentReplyRepositoryPostgres(pool, fakeIdGenerator);

      const nullResult = await threadCommentReplyRepositoryPostgres.findReplyById('not-found-reply-id');
      expect(nullResult).toBeNull();

      const notNullResult = await threadCommentReplyRepositoryPostgres.findReplyById('reply-123');
      expect(notNullResult).not.toBeNull();
    });
  });
});