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

      const nullResult = await threadCommentRepositoryPostgres.findCommentById('not-found-comment-id');
      expect(nullResult).toBeNull();

      const notNullResult = await threadCommentRepositoryPostgres.findCommentById('comment-123');
      expect(notNullResult).not.toBeNull();
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

      expect(comments.length).toBe(1);
      expect(comment.id).toBe('comment-123');
      expect(comment.is_delete).toBe(false);
      expect(comment.content).toBe('Test content');
      expect(comment.username).toBe('username123');
      expect(comment.fullname).toBe('Fullname Test');
    });
  });
});