const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const CreatedThread = require('../../Domains/threads/entities/CreatedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(userId, createThread) {
    const { title, body } = createThread;

    const id = `thread-${this._idGenerator()}`;

    const query = {
      text: `
        INSERT INTO threads (id, title, body, user_id)
        VALUES($1, $2, $3, $4)
        RETURNING threads.id, threads.title, (
            SELECT username
            FROM users
            WHERE users.id = $4
          ) AS owner
      `,
      values: [id, title, body, userId],
    };

    const result = await this._pool.query(query);

    return new CreatedThread({ ...result.rows[0] });
  }

  async findThreadById(threadId) {
    const query = {
      text: 'SELECT * FROM threads WHERE id = $1',
      values: [threadId],
    }
    const result = await this._pool.query(query);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getThreadsWithUser(threadId) {
    const query = {
      text: `
        SELECT t.*, u.username AS username, u.fullname AS fullname
        FROM threads t
        JOIN users u
        ON t.user_id = u.id
        WHERE t.id = $1
        `,
      values: [threadId],
    }
    const result = await this._pool.query(query);

    if (result.rowCount === 0) {
      throw new NotFoundError('tidak dapat menemukan thread');
    }

    return result.rows[0];
  };

  async verifyThreadExistById(threadId) {
    const thread = await this.findThreadById(threadId);
    if (!thread) {
      throw new NotFoundError('tidak dapat menemukan thread');
    }
  }
}

module.exports = ThreadRepositoryPostgres;