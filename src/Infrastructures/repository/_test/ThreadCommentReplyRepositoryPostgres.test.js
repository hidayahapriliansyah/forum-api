const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const ThreadCommentRepositoryPostgres = require('../ThreadCommentRepositoryPostgres');
const ThreadCommentReplyRepositoryPostgres = require('../ThreadCommentReplyRepositoryPostgres');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');
const CreateThreadCommentReply = require('../../../Domains/thread-comment-replies/entities/CreateThreadCommentReply');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');

describe('ThreadCommentReplyRepositoryPostgress', () => {
  afterEach(async () => {
    await ThreadCommentRepliesTableTestHelper.cleanTable();
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });
  // add
  describe('addReply', () => {
    it('should throw error if comment is not exist', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const commentId = 'not-found-comment';

      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentReplyRepositoryPostgres =
        new ThreadCommentReplyRepositoryPostgres(pool, fakeIdGenerator, threadCommentRepositoryPostgres);

      const createThreadCommentReply = new CreateThreadCommentReply({
        content: 'Comment content test'
      });

      await expect(
        threadCommentReplyRepositoryPostgres
          .addCommentReply(userId, commentId, createThreadCommentReply)
      ).rejects.toThrow('Comment tidak ditemukan');
    });

    it('should add reply to a comment correctly', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId })
      const commentId = await ThreadCommentsTableTestHelper.addComment({ userId, threadId });

      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentReplyRepositoryPostgres =
        new ThreadCommentReplyRepositoryPostgres(pool, fakeIdGenerator, threadCommentRepositoryPostgres);

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
    it('should throw error if reply is not exist', async () => {
      const commentId = 'not-found-comment';

      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentReplyRepositoryPostgres =
        new ThreadCommentReplyRepositoryPostgres(pool, fakeIdGenerator, threadCommentRepositoryPostgres);

      await expect(
        threadCommentReplyRepositoryPostgres.softDeleteCommentReplyById(commentId)
      ).rejects.toThrowError('Reply tidak ditemukan.');
    });

    it('should correctly soft delete reply', async () => { 
      const userId = await UsersTableTestHelper.addUser({ id: 'user-test123', username: 'hidayah' });
      const threadId = await ThreadsTableTestHelper.addThread({ userId })
      const commentId = await ThreadCommentsTableTestHelper.addComment({ userId, threadId });
      const replyId = await ThreadCommentRepliesTableTestHelper
        .addReply({ userId, threadCommentId: commentId });


      const fakeIdGenerator = () => '123-aBcD';
      const threadCommentRepositoryPostgres = new ThreadCommentRepositoryPostgres(pool, fakeIdGenerator);
      const threadCommentReplyRepositoryPostgres =
        new ThreadCommentReplyRepositoryPostgres(pool, fakeIdGenerator, threadCommentRepositoryPostgres);

      // action of tested repository
      await threadCommentReplyRepositoryPostgres.softDeleteCommentReplyById(replyId);

      // check
      const deletedReply = await ThreadCommentRepliesTableTestHelper.findReplyByid(replyId);
      expect(deletedReply.id).toBe(replyId);
      expect(deletedReply.deleted_at).not.toBeNull();
      expect(deletedReply.is_delete).toBe(true);
    });
  });
});