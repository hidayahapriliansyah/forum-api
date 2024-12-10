class DeleteThreadCommentReplyUseCase {
  constructor({ 
    threadRepository,
    threadCommentRepository,
    threadCommentReplyRepository,
  }) {
    this._threadRepository = threadRepository;
    this._threadCommentRepository = threadCommentRepository;
    this._threadCommentReplyRepository = threadCommentReplyRepository;
  }

  async execute(userIdPayload, threadIdPayload, threadCommentIdPayload, useCasePayload) {
    const thread = await this._threadRepository.findThreadById(threadIdPayload);
    if (!thread) {
      throw new Error('FIND_THREAD.ID_THREAD_IS_NOT_FOUND');
    }

    const comment = await this._threadCommentRepository.findCommentById(threadCommentIdPayload);
    if (!comment) {
      throw new Error('FIND_COMMENT.ID_COMMENT_IS_NOT_FOUND');
    }

    const reply = await this._threadCommentReplyRepository.findReplyById(useCasePayload);
    if (!reply) {
      throw new Error('FIND_REPLY.ID_REPLY_IS_NOT_FOUND');
    }
    if (reply.user_id !== userIdPayload) {
      throw new Error('DELETE_REPLY.REPLY_IS_NOT_OWNED_BY_USER');
    } 

    return await this._threadCommentReplyRepository
      .softDeleteCommentReplyById(useCasePayload);
  }
}

module.exports = DeleteThreadCommentReplyUseCase;