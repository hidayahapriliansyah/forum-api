/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const PoolUtils = {
  async closePool() {
    await pool.end();
  },
};

module.exports = PoolUtils;
