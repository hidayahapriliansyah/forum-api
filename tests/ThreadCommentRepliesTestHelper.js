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
  }
}

module.exports = ThreadCommentRepliesTableTestHelper;