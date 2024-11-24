/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadsTableTestHelper = {
  async addThread({
    id = 'thread-id-123', 
    userId,
    title = 'Title Test',
    body = 'Body test'
  }) {
    const query = {
      text: `
        INSERT INTO threads (id, title, body, user_id)
        VALUES($1, $2, $3, $4)
        RETURNING id
      `,
      values: [id, title, body, userId],
    };

    const result = await pool.query(query);

    return result.rows[0].id;
  },

  async cleanTable() {
    await pool.query('DELETE FROM threads WHERE 1=1');
  },

  async findOne() {
    const query = {
      text: `
        SELECT * FROM threads LIMIT 1
      `,
    };

    const result = await pool.query(query);

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

module.exports = ThreadsTableTestHelper;