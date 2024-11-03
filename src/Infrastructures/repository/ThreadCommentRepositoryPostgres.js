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
    // find dulu thread nya ada nggak
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

  async softDeleteCommentById(commentId) {
    await this.verifyCommentExistenceById(commentId);

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

  async checkIsCommentExistById(commentId) {
    const query = {
      text: 'SELECT id FROM thread_comments WHERE id = $1',
      values: [commentId],
    }
    const result = await this._pool.query(query);

    return result.rows.length > 0 ? true : false;
  }

  async verifyCommentExistenceById(commentId) {
    const isCommentExist = await this.checkIsCommentExistById(commentId);
    if (!isCommentExist) {
      throw new NotFoundError('Comment tidak ditemukan.');
    }
    return true;
  }
}

module.exports = ThreadCommentRepositoryPostgres;