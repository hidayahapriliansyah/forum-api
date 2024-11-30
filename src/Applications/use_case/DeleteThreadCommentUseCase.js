class DeleteThreadCommentUseCase {
  constructor({ threadCommentRepository }) {
    this._threadCommentRepository = threadCommentRepository;
  }

  async execute(userIdPayload, threadIdPayload, useCasePayload) {
    return await this._threadCommentRepository
      .softDeleteCommentById(userIdPayload, threadIdPayload, useCasePayload);
  }
}

module.exports = DeleteThreadCommentUseCase;
