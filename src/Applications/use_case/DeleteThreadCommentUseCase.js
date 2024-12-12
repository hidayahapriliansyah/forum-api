class DeleteThreadCommentUseCase {
  constructor({
    threadRepository,
    threadCommentRepository
  }) {
    this._threadRepository = threadRepository;
    this._threadCommentRepository = threadCommentRepository;
  }

  async execute(userIdPayload, threadIdPayload, useCasePayload) {
    await this._threadRepository.verifyThreadExistById(threadIdPayload);
    await this._threadCommentRepository.verifyCommentExistAndOwnedByUser(userIdPayload, useCasePayload);

    return await this._threadCommentRepository
      .softDeleteCommentById(useCasePayload);
  }
}

module.exports = DeleteThreadCommentUseCase;
