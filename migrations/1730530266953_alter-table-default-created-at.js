/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.alterColumn('threads', 'created_at', {
    default: pgm.func('CURRENT_TIMESTAMP'),
  });
  pgm.alterColumn('thread_comments', 'created_at', {
    default: pgm.func('CURRENT_TIMESTAMP'),
  });
  pgm.alterColumn('thread_comment_replies', 'created_at', {
    default: pgm.func('CURRENT_TIMESTAMP'),
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('threads', 'created_at', {
    default: null,
  });
  pgm.alterColumn('thread_comments', 'created_at', {
    default: null,
  });
  pgm.alterColumn('thread_comment_replies', 'created_at', {
    default: null,
  });
};
