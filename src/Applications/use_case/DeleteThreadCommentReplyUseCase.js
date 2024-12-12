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
    await this._threadRepository.verifyThreadExistById(threadIdPayload);
    await this._threadCommentRepository.verifyCommentExist(threadCommentIdPayload);
    await this._threadCommentReplyRepository.verifyReplyExistAndOwnedByUser(userIdPayload, useCasePayload);

    return await this._threadCommentReplyRepository
      .softDeleteCommentReplyById(useCasePayload);
  }
}

module.exports = DeleteThreadCommentReplyUseCase;