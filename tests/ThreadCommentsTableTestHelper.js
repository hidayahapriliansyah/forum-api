/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadCommentsTableTestHelper = {
  async addComment({
    id = 'thread-comment-id-123', 
    content = 'Content Test',
    userId,
    threadId,
  }) {
    const query = {
      text: `
        INSERT INTO thread_comments (id, content, user_id, thread_id)
        VALUES($1, $2, $3, $4)
        RETURNING id
      `,
      values: [id, content, userId, threadId],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  },

  async findCommentById(commentId) {
    const query = {
      text: 'SELECT * FROM thread_comments WHERE id = $1',
      values: [commentId],
    };

    const result = await pool.query(query);
    return result.rows[0];
  },

  async cleanTable() {
    await pool.query('DELETE FROM thread_comments WHERE 1=1');
  }
}

module.exports = ThreadCommentsTableTestHelper;