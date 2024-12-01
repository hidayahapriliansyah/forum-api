const { toHex } = require('@hapi/jwt/lib/utils');
const ForbiddenError = require('../../Commons/exceptions/ForbiddenError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const CreatedThreadComment = require('../../Domains/thread-comments/entities/CreatedThreadComment');
const ThreadCommentRepository = require('../../Domains/thread-comments/ThreadCommentRepository');

class ThreadCommentRepositoryPostgres extends ThreadCommentRepository {
  constructor(pool, idGenerator, threadRepositoryPostgress) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._threadRepositoryPostgress = threadRepositoryPostgress;
  }

  async addComment(userId, threadId, createThreadComment) {
    const isThreadExist = await this._threadRepositoryPostgress.checkIsThreadExistById(threadId)
    if (!isThreadExist) {
      throw new NotFoundError('Thread tidak ditemukan.');
    }

    const { content } = createThreadComment;
    const id = `thread-comment-${this._idGenerator()}`;

    const query = {
      text: `
        INSERT INTO thread_comments (id, content, user_id, thread_id)
        VALUES ($1, $2, $3, $4)
        RETURNING thread_comments.id, thread_comments.content, (
          SELECT username
          FROM users
          WHERE users.id = $3
        ) as owner
      `,
      values: [id, content, userId, threadId],
    };
    const result = await this._pool.query(query);
    
    return new CreatedThreadComment({ ...result.rows[0] });
  }

  async softDeleteCommentById(userId, threadId, commentId) {
    const isThreadExist = await this._threadRepositoryPostgress.checkIsThreadExistById(threadId)
    if (!isThreadExist) {
      throw new NotFoundError('Thread tidak ditemukan.');
    }

    await this.verifyCommentOwnerByUserExistenceById(commentId, userId);

    const now = new Date();
    const query = {
      text: `
        UPDATE thread_comments
        SET is_delete = true, deleted_at = $2
        WHERE id = $1
      `,
      values: [commentId, now]
    };

    await this._pool.query(query);
  }

  async findCommentById(commentId) {
    const query = {
      text: 'SELECT * FROM thread_comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async verifyCommentExistenceById(commentId) {
    const threadComment = await this.findCommentById(commentId);
    if (!threadComment) {
      throw new NotFoundError('Comment tidak ditemukan.');
    }
    return true;
  }

  async verifyCommentOwnerByUserExistenceById(commentId, userId) {
    const threadComment = await this.findCommentById(commentId);
    if (!threadComment) {
      throw new NotFoundError('Comment tidak ditemukan.');
    }

    if (threadComment.user_id !== userId) {
      throw new ForbiddenError('Forbidden');
    }
    return true;
  }
}

module.exports = ThreadCommentRepositoryPostgres;