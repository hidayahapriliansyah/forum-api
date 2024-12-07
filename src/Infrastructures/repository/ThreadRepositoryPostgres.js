const CreatedThread = require('../../Domains/threads/entities/CreatedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

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

  async getThreadDetailWithCommentReply(threadId) {
    const query = {
      text: `
        SELECT
          t.id AS thread_id,
          t.title AS thread_title,
          t.body AS thread_body,
          t.created_at AS thread_date,
          ut.username AS thread_username,
          tc.id AS comment_id,
          utc.username AS comment_username,
          tc.created_at AS comment_date,
          tc.is_delete AS comment_is_delete,
          tc.content AS comment_content,
          tcr.id AS reply_id,
          tcr.content AS reply_content,
          tcr.created_at AS reply_date,
          tcr.is_delete AS reply_is_delete,
          utcr.username AS reply_username
        FROM threads AS t
        JOIN users AS ut ON ut.id=t.user_id
        LEFT JOIN thread_comments AS tc ON tc.thread_id=t.id
        LEFT JOIN users AS utc ON utc.id=tc.user_id 
        LEFT JOIN thread_comment_replies AS tcr ON tcr.thread_comment_id=tc.id
        LEFT JOIN users as utcr ON utcr.id=tcr.user_id
        WHERE t.id = $1
        ORDER BY
          tc.created_at ASC,
          tcr.created_at ASC 
      `,
      values: [threadId]
    };

    const result = await this._pool.query(query);
    return result;
  }

  async checkIsThreadExistById(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    }
    const result = await this._pool.query(query);
    return result.rows.length > 0 ? true : false;
  }

  async verifyThreadExistenceById(threadId) {
    const isThreadExist = await this.checkIsThreadExistById(threadId);
    if (!isThreadExist) {
      throw new NotFoundError('Thread tidak ditemukan.');
    }
    return true;
  }
}

module.exports = ThreadRepositoryPostgres;