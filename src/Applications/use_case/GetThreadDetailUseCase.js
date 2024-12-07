const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class GetThreadDetailUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const queryResult = await this._threadRepository.getThreadDetailWithCommentReply(useCasePayload);
    if (queryResult.rows.length <= 0) {
      throw new NotFoundError('FIND_THREAD.ID_THREAD_IS_NOT_FOUND');
    }

    const mappedQueryResult = this._mapThreadCommentAndReviews(queryResult);
    return mappedQueryResult;
  }

  _mapThreadCommentAndReviews(threadResult) {
    const threadDetail = {
      id: threadResult.rows[0].thread_id,
      title: threadResult.rows[0].thread_title,
      body: threadResult.rows[0].thread_body,
      date: threadResult.rows[0].thread_date,
      username: threadResult.rows[0].thread_username,
      comments: []
    };

    const commentMap = new Map();

    threadResult.rows.forEach(row => {
      // Jika komentar belum ada dalam commentMap, tambahkan
      if (!commentMap.has(row.comment_id)) {
        const comment = {
          id: row.comment_id,
          username: row.comment_username,
          date: row.comment_date,
          content: this._changeDeletedCommentContent(row.comment_is_delete, row.comment_content),
          replies: []
        };
        commentMap.set(row.comment_id, comment);
        threadDetail.comments.push(comment);
      }

      // Ambil komentar dari commentMap dan tambahkan reply ke dalamnya
      const comment = commentMap.get(row.comment_id);

      // Tambahkan reply jika ada
      if (row.reply_id) {
        comment.replies.push({
          id: row.reply_id,
          content: this._changeDeletedReplyContent(row.reply_is_delete, row.reply_content),
          date: row.reply_date,
          username: row.reply_username
        });
      }
    });

    return threadDetail;
  }

  _changeDeletedCommentContent(isDelete, content) {
    return isDelete ? "**komentar telah dihapus**" : content;
  }

  _changeDeletedReplyContent(isDelete, content) {
    return isDelete ? "**balasan telah dihapus**" : content;
  }
}

module.exports = GetThreadDetailUseCase;