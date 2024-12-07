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
}

module.exports = ThreadCommentReplyRepositoryPostgres;