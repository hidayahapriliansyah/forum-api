const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const CreatedThread = require('../../../Domains/threads/entities/CreatedThread');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
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
});