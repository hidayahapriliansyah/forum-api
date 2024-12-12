class GetThreadDetailUseCase {
  constructor({
    threadRepository,
    threadCommentRepository,
    threadCommentReplyRepository,
  }) {
    this._threadRepository = threadRepository;
    this._threadCommentRepository = threadCommentRepository;
    this._threadCommentReplyRepository = threadCommentReplyRepository;
  }

  async execute(useCasePayload) {
    const threads = await this._threadRepository.getThreadsWithUser(useCasePayload);
    if (threads.length === 0) {
      throw new Error('FIND_THREAD.ID_THREAD_IS_NOT_FOUND');
    }
    const thread = threads[0];
    const comments = await this._threadCommentRepository.getCommentsWithUserFromThread(thread.id);
    const replies = await Promise.all(comments.map(async (comment) =>
      await this._threadCommentReplyRepository.getReplyWithUserFromComment(comment.id)
    )).then((results) => results.flat());

    const mappedCommentsWithReplies = comments.map((comment) => {
      const mappedComment = this._mapComment(comment);
      mappedComment.replies = replies
        .filter((reply) => reply.thread_comment_id === mappedComment.id)
        .map((reply) => this._mapReply(reply));
      return mappedComment;
    });
    const mappedThread = this._mapThread(thread);
    mappedThread.comments = mappedCommentsWithReplies;

    return mappedThread;
  }

  _mapThread(thread) {
    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.created_at,
      username: thread.username,
      comments: []
    }
  };

  _mapComment(comment) {
    return {
      id: comment.id,
      username: comment.username,
      date: comment.created_at,
      content: this._changeDeletedCommentContent(comment.is_delete, comment.content),
      replies: []
    }
  }

  _mapReply(reply) {
    return {
      id: reply.id,
      content: this._changeDeletedReplyContent(reply.is_delete, reply.content),
      date: reply.created_at,
      username: reply.username
    }
  }

  _changeDeletedCommentContent(isDelete, content) {
    return isDelete ? "**komentar telah dihapus**" : content;
  }

  _changeDeletedReplyContent(isDelete, content) {
    return isDelete ? "**balasan telah dihapus**" : content;
  }
}

module.exports = GetThreadDetailUseCase;