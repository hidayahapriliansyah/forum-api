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

  describe('findThreadById', () => {
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123'});
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', userId });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
    });

    it('should find thread correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const nullResult = await threadRepositoryPostgres.findThreadById('not-found-thread-id');
      expect(nullResult).toBeNull();

      const notNullResult = await threadRepositoryPostgres.findThreadById('thread-123');
      expect(notNullResult).not.toBeNull();
    });
  });

  describe('getThreadsWithUser', () => {
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'username',
        fullname: 'Fullname Test'
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        userId,
        body: 'Body test',
        title: 'Title Test'
      });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
    });

    it('should get thread with user correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const threads = await threadRepositoryPostgres.getThreadsWithUser('thread-123')
      const thread = threads[0];

      expect(threads.length).toBe(1);
      expect(thread.id).toBe('thread-123');
      expect(thread.title).toBe('Title Test');
      expect(thread.body).toBe('Body test');
      expect(thread.created_at).toBeDefined();
      expect(thread.username).toBe('username');
      expect(thread.fullname).toBe('Fullname Test');
    });
  });
});
