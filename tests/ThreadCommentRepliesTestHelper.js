/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadCommentRepliesTableTestHelper = {
  async addReply({
    id = 'thread-comment-reply-id-123', 
    content = 'Reply Content Test',
    userId,
    threadCommentId,
  }) {
    const query = {
      text: `
        INSERT INTO thread_comment_replies (id, content, user_id, thread_comment_id)
        VALUES($1, $2, $3, $4)
        RETURNING id
      `,
      values: [id, content, userId, threadCommentId],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  },

  async cleanTable() {
    await pool.query('DELETE FROM thread_comment_replies WHERE 1=1');
  },

  async findReplyByid(replyId) {
    const query = {
      text: `
        SELECT id, created_at, content, is_delete, deleted_at
        FROM thread_comment_replies
        WHERE id = $1
      `,
      values: [replyId],
    };

    const result = await pool.query(query);

    return result.rows.length > 0 ? result.rows[0] : null;
  },

  async softDeleteById(commentId) {
    const query = {
      text: `
        UPDATE thread_comment_replies
        SET is_delete = true, deleted_at = $1
        WHERE id = $2
      `,
      values: [new Date(), commentId],
    };
    await pool.query(query);
  },

  async findOne() {
    const query = {
      text: `
        SELECT * FROM thread_comment_replies LIMIT 1
      `,
    };

    const result = await pool.query(query);

    return result.rows.length > 0 ? result.rows[0] : null;
  },
}

module.exports = ThreadCommentRepliesTableTestHelper;