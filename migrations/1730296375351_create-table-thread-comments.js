/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('thread_comments', {
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
    thread_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    }
  });

  pgm.addConstraint('thread_comments', 'fk_thread_id_in_thread_comments', {
    foreignKeys: {
      columns: 'thread_id',
      references: 'threads(id)',
      onDelete: 'CASCADE',
    }
  });

  pgm.addConstraint('thread_comments', 'fk_user_id_in_thread_comments', {
    foreignKeys: {
      columns: 'user_id',
      references: 'users(id)',
      onDelete: 'CASCADE',
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('thred_comments');
};
