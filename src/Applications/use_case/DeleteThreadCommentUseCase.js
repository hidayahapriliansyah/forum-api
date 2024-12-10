class DeleteThreadCommentUseCase {
  constructor({
    threadRepository,
    threadCommentRepository
  }) {
    this._threadRepository = threadRepository;
    this._threadCommentRepository = threadCommentRepository;
  }

  async execute(userIdPayload, threadIdPayload, useCasePayload) {
    const thread = await this._threadRepository.findThreadById(threadIdPayload);
    if (!thread) {
      throw new Error('FIND_THREAD.ID_THREAD_IS_NOT_FOUND');
    }

    const comment = await this._threadCommentRepository.findCommentById(useCasePayload);
    if (!comment) {
      throw new Error('FIND_COMMENT.ID_COMMENT_IS_NOT_FOUND');
    }

    if (comment.user_id !== userIdPayload) {
      throw new Error('DELETE_COMMENT.COMMENT_IS_NOT_OWNED_BY_USER');
    }

    return await this._threadCommentRepository
      .softDeleteCommentById(useCasePayload);
  }
}

module.exports = DeleteThreadCommentUseCase;
