const ForbiddenError = require('../../../Commons/exceptions/ForbiddenError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const ThreadCommentRepository = require('../../../Domains/thread-comments/ThreadCommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteThreadCommentUseCase = require('../DeleteThreadCommentUseCase');

describe('DeleteThreadCommentUseCase', () =>  {
  it('should orchestrating the delete thread comment action correctly', async () => {
    const validUserId = 'user-123';
    const invalidUserId = 'user-12';
    const validThreadId = 'thread-123';
    const invalidThreadId = 'thread-12';

    const validUseCasePayload = 'comment-123';
    const invalidUseCasePayload = 'comment-12';

    const mockThreadRepository = new ThreadRepository();
    const mockThreadCommentRepository = new ThreadCommentRepository();

    mockThreadRepository.findThreadById = 
      jest.fn().mockImplementation((threadId) => {
        return threadId == 'thread-123'
          ? {
            id: 'thread-123',
            body: 'test body'
          }
          : null;
      });
    mockThreadCommentRepository.findCommentById =
      jest.fn().mockImplementation((commentId) => {
        return commentId == 'comment-123'
          ? {
            id: 'comment-123',
            contet: 'test body',
            user_id: 'user-123',
          }
          : null;
      });
    mockThreadCommentRepository.softDeleteCommentById =
      jest.fn().mockImplementation(() => Promise.resolve());

    const getThreadCommentUseCase = new DeleteThreadCommentUseCase({
      threadRepository: mockThreadRepository,
      threadCommentRepository: mockThreadCommentRepository,
    });

    const deletedThreadComment = await getThreadCommentUseCase
      .execute(validUserId, validThreadId, validUseCasePayload);

    expect(deletedThreadComment).toStrictEqual(undefined);
    expect(mockThreadCommentRepository.softDeleteCommentById).toBeCalledWith(validUseCasePayload);

    await expect(getThreadCommentUseCase.execute(validUserId, invalidThreadId, validUseCasePayload))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentUseCase.execute(validUserId, validThreadId, invalidThreadId))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadCommentRepository.findCommentById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentUseCase.execute(invalidUserId, validThreadId, validUseCasePayload))
      .rejects.toThrow(ForbiddenError);
    expect(mockThreadCommentRepository.findCommentById).toBeCalledWith(validUseCasePayload);
  });
});