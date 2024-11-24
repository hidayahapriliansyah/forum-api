const CreateThreadComment = require('../../Domains/thread-comments/entities/CreateThreadComment');

class AddThreadCommentUseCase {
  constructor({ threadCommentRepository }) {
    this._threadCommentRepository = threadCommentRepository;
  }

  async execute(userIdPayload, threadIdPayload, useCasePayload) {
    const createThreadComment = new CreateThreadComment(useCasePayload);
    return await this._threadCommentRepository
      .addComment(userIdPayload, threadIdPayload, createThreadComment);
  }
}

module.exports = AddThreadCommentUseCase;