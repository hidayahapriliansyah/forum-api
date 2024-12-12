const CreateThreadComment = require('../../Domains/thread-comments/entities/CreateThreadComment');

class AddThreadCommentUseCase {
  constructor({
    threadRepository,
    threadCommentRepository,
  }) {
    this._threadRepository = threadRepository;
    this._threadCommentRepository = threadCommentRepository;
  }

  async execute(userIdPayload, threadIdPayload, useCasePayload) {
    await this._threadRepository.verifyThreadExistById(threadIdPayload);

    const createThreadComment = new CreateThreadComment(useCasePayload);
    return await this._threadCommentRepository
      .addComment(userIdPayload, threadIdPayload, createThreadComment);
  }
}

module.exports = AddThreadCommentUseCase;