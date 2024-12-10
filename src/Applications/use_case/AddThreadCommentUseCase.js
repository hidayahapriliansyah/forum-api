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
    const thread = await this._threadRepository.findThreadById(threadIdPayload);
    if (!thread) {
      throw new Error('FIND_THREAD.ID_THREAD_IS_NOT_FOUND');
    }

    const createThreadComment = new CreateThreadComment(useCasePayload);
    return await this._threadCommentRepository
      .addComment(userIdPayload, threadIdPayload, createThreadComment);
  }
}

module.exports = AddThreadCommentUseCase;