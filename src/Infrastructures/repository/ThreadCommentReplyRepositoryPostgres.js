const ForbiddenError = require('../../Commons/exceptions/ForbiddenError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const ThreadCommentReplyRepository = require('../../Domains/thread-comment-replies/ThreadCommentReplyRepository');

class ThreadCommentReplyRepositoryPostgres extends ThreadCommentReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addCommentReply(userId, commentId, createCommentReply) {
    const id = `thread-comment-reply-${this._idGenerator()}`
    const { content } = createCommentReply;

    const query = {
      text: `
        INSERT INTO thread_comment_replies (id, content, user_id, thread_comment_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, content, (
          SELECT username FROM users
          WHERE id = $3
        ) AS owner
      `,
      values: [id, content, userId, commentId],
    };

    const result = await this._pool.query(query);
    return result.rows[0];
  }

  async softDeleteCommentReplyById(replyId) {
    const query = {
      text: `
        UPDATE thread_comment_replies
        SET is_delete = true, deleted_at = $2
        WHERE id = $1
      `,
      values: [replyId, new Date()],
    };

    await this._pool.query(query);
  }

  async findReplyById(replyId) {
    const query = {
      text: `
        SELECT * FROM thread_comment_replies WHERE id = $1
      `,
      values: [replyId],
    };

    const result = await this._pool.query(query);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getReplyWithUserFromComment(commentId) {
    const query = {
      text: `
        SELECT tcr.*, u.username AS username, u.fullname AS fullname
        FROM thread_comment_replies tcr
        JOIN users u
        ON u.id = tcr.user_id
        WHERE tcr.thread_comment_id = $1
        ORDER BY tcr.created_at ASC
      `,
      values: [commentId]
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async verifyReplyExistAndOwnedByUser(userId, replyId) {
    const reply = await this.findReplyById(replyId);
    if (!reply) {
      throw new NotFoundError('tidak dapat menemukan reply');
    }
    if (reply.user_id !== userId) {
      throw new ForbiddenError('access data tidak diperbolehkan');
    }
  }
}

module.exports = ThreadCommentReplyRepositoryPostgres;