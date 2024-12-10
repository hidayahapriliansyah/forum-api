const ThreadCommentRepository = require('../ThreadCommentRepository');

describe('ThreadCommentRepository', () => {
  it('should throw error when invoke abstract behavior', async () => {
    const threadCommentRepository = new ThreadCommentRepository();

    await expect(threadCommentRepository.addComment({}))
      .rejects.toThrowError('THREAD_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(threadCommentRepository.softDeleteCommentById({}))
      .rejects.toThrowError('THREAD_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(threadCommentRepository.findCommentById({}))
      .rejects.toThrowError('THREAD_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(threadCommentRepository.getCommentsWithUserFromThread({}))
      .rejects.toThrowError('THREAD_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  });
});