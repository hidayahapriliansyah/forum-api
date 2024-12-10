const CreateThreadCommentReply = require('../../Domains/thread-comment-replies/entities/CreateThreadCommentReply');

class AddThreadCommentReplyUseCase {
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

    const createdThreadCommentReply = new CreateThreadCommentReply(useCasePayload);
    return await this._threadCommentReplyRepository
      .addCommentReply(userIdPayload, threadCommentIdPayload, createdThreadCommentReply);
  }
}

module.exports = AddThreadCommentReplyUseCase;