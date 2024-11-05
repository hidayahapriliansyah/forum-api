/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const AuthenticationsTableTestHelper = {
  async addToken(token) {
    const query = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };

    await pool.query(query);
  },

  async findToken(token) {
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    const result = await pool.query(query);

    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM authentications WHERE 1=1');
  },

  async checkIsTableEmpty() {
    const query = {
      text: 'SELECT token FROM authentications LIMIT 1',
    };

    const result = await pool.query(query);

    return result.rows.length > 0 ? false : true;
  }
};

module.exports = AuthenticationsTableTestHelper;
