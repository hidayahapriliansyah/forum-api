const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const CreatedThread = require('../../../Domains/threads/entities/CreatedThread');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await ThreadCommentsTableTestHelper.cleanTable();
    await ThreadCommentRepliesTableTestHelper.cleanTable();
  });

  describe('createThread function', () => {
    it('should create thread correctly', async () => {
      const userId = await UsersTableTestHelper.addUser({ username: 'hidayah' });

      const createThread = new CreateThread({
        title: 'Thread title test',
        body: 'Thread body test',
      });

      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const addedThread = await threadRepositoryPostgres.addThread(userId, createThread);

      expect(addedThread).toStrictEqual(new CreatedThread({
        id: 'thread-123aBcDef',
        owner: 'hidayah',
        title: 'Thread title test',
      }));

      const threadOnDb = await ThreadsTableTestHelper.findOne();
      expect(threadOnDb).not.toBeNull();
    });
  });

  describe('getThreadDetailByIdWithCommentAndReply', () => {
    it('should return thread correctly', async () => {
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

      // create 2 reply on not deleted comment
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

      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // action
      const result = await threadRepositoryPostgres.getThreadDetailWithCommentReply(threadId);

      const threadResult = result.rows;

      expect(Array.isArray(threadResult)).toBe(true);

      expect(threadResult.length).toBe(3);

      threadResult.forEach(row => {
        expect(row.thread_id).toBe('thread-id-123');
        expect(row.thread_title).toBe('Title Test');
        expect(row.thread_body).toBe('Body test');
        expect(row.thread_date).toBeDefined();
        expect(row.thread_username).toBe('user_a');
      });

      const comment1 = threadResult.find(row => row.comment_id === 'thread-comment-2');
      expect(comment1).toBeDefined();
      expect(comment1.comment_username).toBe('user_b');
      expect(comment1.comment_date).toBeDefined();
      expect(comment1.comment_is_delete).toBe(true);
      expect(comment1.comment_content).toBe('Content Test');
      expect(comment1.reply_id).toBeNull();
      expect(comment1.reply_content).toBeNull();

      const comment2 = threadResult.filter(row => row.comment_id === 'thread-comment-1');
      expect(comment2.length).toBe(2);

      const reply1 = comment2.find(row => row.reply_id === 'thread-comment-reply-2');
      expect(reply1).toBeDefined();
      expect(reply1.reply_content).toBe('Reply Content Test');
      expect(reply1.reply_is_delete).toBe(true);
      expect(reply1.reply_username).toBe('user_c');

      const reply2 = comment2.find(row => row.reply_id === 'thread-comment-reply-1');
      expect(reply2).toBeDefined();
      expect(reply2.reply_content).toBe('Reply Content Test');
      expect(reply2.reply_is_delete).toBe(false);
      expect(reply2.reply_username).toBe('user_c');
    });
  });
});