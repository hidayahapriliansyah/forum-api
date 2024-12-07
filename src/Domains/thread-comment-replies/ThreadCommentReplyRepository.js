class ThreadCommentReplyRepository {
  async addCommentReply(userId, commentId, createThreadCommentReply) {
    throw new Error('THREAD_COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async softDeleteCommentReplyById(threadCommentReplyId) {
    throw new Error('THREAD_COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async findReplyById(replyId) {
    throw new Error('THREAD_COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
}

module.exports = ThreadCommentReplyRepository;