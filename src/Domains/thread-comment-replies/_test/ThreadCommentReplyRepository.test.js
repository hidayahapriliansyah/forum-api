const ThreadCommentReplyRepository = require('../ThreadCommentReplyRepository');

describe('ThreadCommentReplyRepository', () => {
  it('should throw error when invoke abstract behavior', async () => {
    const threadCommentReplyRepository = new ThreadCommentReplyRepository();

    await expect(threadCommentReplyRepository.addComment({}))
      .rejects.toThrowError('THREAD_COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(threadCommentReplyRepository.deleteComment({}))
      .rejects.toThrowError('THREAD_COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  });
});