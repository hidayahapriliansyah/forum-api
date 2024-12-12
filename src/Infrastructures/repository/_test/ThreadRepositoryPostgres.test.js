const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const CreatedThread = require('../../../Domains/threads/entities/CreatedThread');
const ThreadCommentsTableTestHelper = require('../../../../tests/ThreadCommentsTableTestHelper');
const ThreadCommentRepliesTableTestHelper = require('../../../../tests/ThreadCommentRepliesTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

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

      const notExistThread = await threadRepositoryPostgres.findThreadById('not-found-thread-id');
      expect(notExistThread).toBeNull();

      const existThread = await threadRepositoryPostgres.findThreadById('thread-123');
      expect(Object.keys(existThread).length).toBe(5);
      expect(existThread.id).toBe('thread-123');
      expect(existThread.created_at).toBeDefined();
      expect(existThread.title).toBe('Title Test');
      expect(existThread.body).toBe('Body test');
      expect(existThread.user_id).toBe('user-123');
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

      const thread = await threadRepositoryPostgres.getThreadsWithUser('thread-123')

      expect(thread).toStrictEqual(
        expect.objectContaining({
          id: 'thread-123',
          created_at: expect.any(Date),
          title: 'Title Test',
          body: 'Body test',
          user_id: 'user-123',
          username: 'username',
          fullname: 'Fullname Test'
        })
      )
    });

    it('shoudl throw not found error if thread is not exist', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadRepositoryPostgres.getThreadsWithUser('random-thread-id'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('verifyThreadExistById', () => {
    beforeEach(async () => {
      const userId = await UsersTableTestHelper.addUser({ id: 'user-123'});
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', userId });
    });

    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
    });

    it('should throw not found if thread is not exist correctly', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadRepositoryPostgres.verifyThreadExistById('random-thread-id'))
        .rejects.toThrow(NotFoundError);
    });

    it('should return resolve promise if parameter is valid', async () => {
      const fakeIdGenerator = () => '123aBcDef';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      await expect(threadRepositoryPostgres.verifyThreadExistById('thread-123'))
        .resolves.not.toThrow();
    });
  })
});
