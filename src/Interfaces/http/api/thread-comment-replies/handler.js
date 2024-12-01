const AddThreadCommentReplyUseCase = require('../../../../Applications/use_case/AddThreadCommentReplyUsecase');

class ThreadCommentRepliesHandler {
  constructor(container) {
    this._container = container;
    this.postThreadCommentReplyHandler = this.postThreadCommentReplyHandler.bind(this);
  }

  async postThreadCommentReplyHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;

    const addThreadCommentReplyUseCase = this._container.getInstance(AddThreadCommentReplyUseCase.name);
    const addedThreadCommentReply = await addThreadCommentReplyUseCase
      .execute(userId, threadId, commentId, request.payload);

    const response = h.response({
      status: 'success',
      data: { addedReply: addedThreadCommentReply },
    })

    response.code(201);
    return response;    
  }
}

module.exports = ThreadCommentRepliesHandler;