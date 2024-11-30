const AddThreadCommentUseCase = require('../../../../Applications/use_case/AddThreadCommentUseCase');
const DeleteThreadCommentUseCase = require('../../../../Applications/use_case/DeleteThreadCommentUseCase');
const ThreadCommentRepository = require('../../../../Domains/thread-comments/ThreadCommentRepository');

class ThreadCommentsHandler {
  constructor(container) {
    this._container = container;
    this.postThreadCommentHandler = this.postThreadCommentHandler.bind(this);
    this.deleteThreadCommentHandler = this.deleteThreadCommentHandler.bind(this);
  }

  async postThreadCommentHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { threadId } = request.params;

    const addThreadCommentUseCase = this._container.getInstance(AddThreadCommentUseCase.name);
    const addedThreadComment = await addThreadCommentUseCase
      .execute(userId, threadId, request.payload);

    const response = h.response({
      status: 'success',
      data: { addedComment: addedThreadComment },
    })

    response.code(201);
    return response;    
  }

  async deleteThreadCommentHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { threadId, commentId } = request.params;

    const deleteThreadCommentUseCase = this._container.getInstance(DeleteThreadCommentUseCase.name);
    await deleteThreadCommentUseCase.execute(userId, threadId, commentId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menghapus comment',
    })

    response.code(200);
    return response;    
  }
}

module.exports = ThreadCommentsHandler;