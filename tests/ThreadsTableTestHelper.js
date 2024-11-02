/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadsTableTestHelper = {
  async addThread({
    id = 'thread-id-123', 
    userId,
    title = 'Title Test',
    body = 'Body test',
    createdAt = new Date()
  }) {
    const query = {
      text: 'INSERT INTO threads (id, created_at, title, body, user_id) VALUES($1, $2, $3, $4, $5)',
      values: [id, createdAt, title, body, userId],
    };

    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM threads WHERE 1=1');
  }
}

module.exports = ThreadsTableTestHelper;