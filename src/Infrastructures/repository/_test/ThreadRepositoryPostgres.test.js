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
    });
  });

  describe('findThreadById', () => {
    // create thread first cuy
    it('should return null if thread is not found', async () => {
      const threadId = 'thread-nout-found';

      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadRepositoryPostgres.findThreadById(threadId))
        .rejects
        .toThrowError('Thread tidak ditemukan.');
    });

    it('should return thread correctly', async () => {
      // create user a
      // create thread from user a
      // create user b
      // create comment for thread user a from user b
      // create user c
      // create reply for thread comment user b from user c

      const userIdA = await UsersTableTestHelper.addUser({ id: 'id-user-a', username: 'user_a' });
      const userIdB = await UsersTableTestHelper.addUser({ id: 'id-user-b', username: 'user_b' });
      const userIdC = await UsersTableTestHelper.addUser({ id: 'id-user-c', username: 'user_c' });

      const threadId = await ThreadsTableTestHelper.addThread({ userId: userIdA });

      const threadCommentAId = await ThreadCommentsTableTestHelper.addComment({
        id: 'thread-comment-1',
        userId: userIdB,
        threadId,
      });
      await ThreadCommentsTableTestHelper.addComment({
        id: 'thread-comment-2',
        userId: userIdB,
        threadId,
      });

      await ThreadCommentRepliesTableTestHelper.addReply({
        id: 'thread-comment-reply-1',
        userId: userIdC,
        threadCommentId: threadCommentAId,
      });
      await ThreadCommentRepliesTableTestHelper.addReply({
        id: 'thread-comment-reply-2',
        userId: userIdC,
        threadCommentId: threadCommentAId,
      });

      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const threadDetail = await threadRepositoryPostgres.findThreadById(threadId);

      expect(threadDetail.id).toBe(threadId);
      expect(threadDetail.title).toBeDefined();
      expect(threadDetail.body).toBeDefined();
      expect(threadDetail.date).toBeDefined();
      expect(threadDetail.username).toBeDefined();
      expect(threadDetail.comments.length).toBe(2);
      expect(threadDetail.comments[0].id).toBe('thread-comment-2');
      expect(threadDetail.comments[0].username).toBeDefined();
      expect(threadDetail.comments[0].date).toBeDefined();
      expect(threadDetail.comments[0].content).toBeDefined();
      expect(threadDetail.comments[0].replies.length).toBe(0);
      expect(threadDetail.comments[1].replies.length).toBe(2);
      expect(threadDetail.comments[1].replies[0].id).toBe('thread-comment-reply-2');
      expect(threadDetail.comments[1].replies[0].username).toBeDefined();
      expect(threadDetail.comments[1].replies[0].date).toBeDefined();
      expect(threadDetail.comments[1].replies[0].content).toBeDefined();
    });
  });
});