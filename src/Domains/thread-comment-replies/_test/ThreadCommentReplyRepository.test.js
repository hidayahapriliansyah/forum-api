const ThreadCommentReplyRepository = require('../ThreadCommentReplyRepository');

describe('ThreadCommentReplyRepository', () => {
  it('should throw error when invoke abstract behavior', async () => {
    const threadCommentReplyRepository = new ThreadCommentReplyRepository();

    await expect(threadCommentReplyRepository.addCommentReply({}))
      .rejects.toThrowError('THREAD_COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(threadCommentReplyRepository.deleteCommentReply({}))
      .rejects.toThrowError('THREAD_COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  });
});