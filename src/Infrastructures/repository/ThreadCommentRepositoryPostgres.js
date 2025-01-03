const { toHex } = require('@hapi/jwt/lib/utils');
const ForbiddenError = require('../../Commons/exceptions/ForbiddenError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const CreatedThreadComment = require('../../Domains/thread-comments/entities/CreatedThreadComment');
const ThreadCommentRepository = require('../../Domains/thread-comments/ThreadCommentRepository');

class ThreadCommentRepositoryPostgres extends ThreadCommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(userId, threadId, createThreadComment) {
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
    }
    const queryResult = await this._pool.query(query);
    return queryResult.rows.length > 0 ? queryResult.rows[0] : null;
  }

  async getCommentsWithUserFromThread(threadId) {
    const query = {
      text: `
        SELECT tc.*,  u.username AS username, u.fullname AS fullname
        FROM
        thread_comments tc
        JOIN users u
        ON tc.user_id = u.id
        WHERE tc.thread_id = $1
        ORDER BY tc.created_at ASC
      `,
      values: [threadId],
    }

    const result = await this._pool.query(query);
    return result.rows;
  }

  async verifyCommentExistAndOwnedByUser(userId, commentId) {
    const comment = await this.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundError('tidak dapat menemukan comment');
    }
    if (comment.user_id !== userId) {
      throw new ForbiddenError('access data tidak diperbolehkan');
    }
  }

  async verifyCommentExist(commentId) {
    const comment = await this.findCommentById(commentId);
    if (!comment) {
      throw new NotFoundError('tidak dapat menemukan comment');
    }
  }
}

module.exports = ThreadCommentRepositoryPostgres;