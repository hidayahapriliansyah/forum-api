const NotFoundError = require('../../Commons/exceptions/NotFoundError');
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
    const thread = this._threadRepository.findThreadById(threadIdPayload);
    if (!thread) {
      throw new NotFoundError('FIND_THREAD.ID_THREAD_IS_NOT_FOUND');
    }

    const createThreadComment = new CreateThreadComment(useCasePayload);
    return await this._threadCommentRepository
      .addComment(userIdPayload, threadIdPayload, createThreadComment);
  }
}

module.exports = AddThreadCommentUseCase;