const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const ThreadCommentReplyRepository = require('../../Domains/thread-comment-replies/ThreadCommentReplyRepository');

class ThreadCommentReplyRepositoryPostgres extends ThreadCommentReplyRepository {
  constructor(pool, idGenerator, threadCommentRepositoryPostgress) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
    this._threadCommentRepositoryPostgress = threadCommentRepositoryPostgress;
  }

  async addCommentReply(userId, commentId, createCommentReply) {
    await this._threadCommentRepositoryPostgress.verifyCommentExistenceById(commentId);

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
    await this.verifyReplyExistenceById(replyId);

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

  async checkIsReplyExist(replyId) {
    const query = {
      text: 'SELECT id FROM thread_comment_replies WHERE id = $1',
      values: [replyId],
    };
    const result = await this._pool.query(query);
    return result.rows.length > 0 ? true : false;
  }

  async verifyReplyExistenceById(replyId) {
    const isReplyExist = await this.checkIsReplyExist(replyId);
    if (!isReplyExist) {
      throw new NotFoundError('Reply tidak ditemukan.');
    }
    return true;
  }
}

module.exports = ThreadCommentReplyRepositoryPostgres;