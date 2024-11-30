class DeleteThreadCommentReplyUseCase {
  constructor({ threadCommentReplyRepository }) {
    this._threadCommentReplyRepository = threadCommentReplyRepository;
  }

  async execute(userIdPayload, threadIdPayload, threadCommentIdPayload, useCasePayload) {
    return await this._threadCommentReplyRepository
      .softDeleteCommentReplyById(userIdPayload, threadIdPayload, threadCommentIdPayload, useCasePayload);
  }
}

module.exports = DeleteThreadCommentReplyUseCase;