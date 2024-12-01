const AddThreadCommentReplyUseCase = require('../../../../Applications/use_case/AddThreadCommentReplyUsecase');
const DeleteThreadCommentReplyUseCase = require('../../../../Applications/use_case/DeleteThreadCommentReplyUseCase');

class ThreadCommentRepliesHandler {
  constructor(container) {
    this._container = container;
    this.postThreadCommentReplyHandler = this.postThreadCommentReplyHandler.bind(this);
    this.deleteThreadCommentReplyHandler = this.deleteThreadCommentReplyHandler.bind(this);
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

  async deleteThreadCommentReplyHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId, replyId } = request.params;

    const deleteThreadCommentUseCase = this._container.getInstance(DeleteThreadCommentReplyUseCase.name);
    await deleteThreadCommentUseCase.execute(userId, threadId, commentId, replyId);

    const response = h.response({
      status: 'success'
    })

    response.code(200);
    return response;
  }
}

module.exports = ThreadCommentRepliesHandler;