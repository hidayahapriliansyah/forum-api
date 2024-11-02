/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('thread_comment_replies', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
    },
    is_delete: {
      type: 'boolean',
      notNull: true,
      default: pgm.func('false'),
    },
    deleted_at: {
      type: 'TIMESTAMP',
      notNull: false,
    },
    content: {
      type: 'VARCHAR(200)',
      notNull: false,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    thread_comment_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    }
  });

  pgm.addConstraint('thread_comment_replies', 'fk_thread_comment_id_in_thread_comment_replies', {
    foreignKeys: {
      columns: 'thread_comment_id',
      references: 'thread_comments(id)',
      onDelete: 'CASCADE',
    }
  });

  pgm.addConstraint('thread_comment_replies', 'fk_user_id_in_thread_comment_replies', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users(id)',
      onDelete: 'CASCADE',
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('thread_comment_replies')
};
