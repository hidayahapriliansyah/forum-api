/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');
const bcrypt = require('bcrypt');
const { findOne } = require('./ThreadsTableTestHelper');

const UsersTableTestHelper = {
  async addUser({
    id = 'user-123', username = 'dicoding', password = 'secret', fullname = 'Dicoding Indonesia',
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  },

  async findUsersById(id) {
    const query = {
      text: 'SELECT * FROM users WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM users WHERE 1=1');
  },

  async findOne() {
    const query = {
      text: 'SELECT * FROM users LIMIT 1',
    };

    const result = await pool.query(query);
    return result.rows[0];
  }
};

module.exports = UsersTableTestHelper;
