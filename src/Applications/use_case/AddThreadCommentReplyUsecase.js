const CreateThreadCommentReply = require('../../Domains/thread-comment-replies/entities/CreateThreadCommentReply');

class AddThreadCommentReplyUseCase {
  constructor({ threadCommentReplyRepository }) {
    this._threadCommentReplyRepository = threadCommentReplyRepository;
  }

  async execute(userIdPayload, threadIdPayload, threadCommentIdPayload, useCasePayload) {
    const createdThreadCommentReply = new CreateThreadCommentReply(useCasePayload);
    return await this._threadCommentReplyRepository
      .addCommentReply(userIdPayload, threadIdPayload, threadCommentIdPayload, createdThreadCommentReply);
  }
}

module.exports = AddThreadCommentReplyUseCase;