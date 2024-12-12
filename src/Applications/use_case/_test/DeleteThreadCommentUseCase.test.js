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

    mockThreadRepository.verifyThreadExistById = 
      jest.fn().mockImplementation((threadId) => {
        if (threadId !== 'thread-123') {
          throw new NotFoundError('tidak dapat menemukan thread');
        }
        return Promise.resolve();
      });
    mockThreadCommentRepository.verifyCommentExistAndOwnedByUser =
      jest.fn().mockImplementation((userId, commentId) => {
        if (commentId !== 'comment-123') {
          throw new NotFoundError('tidak dapat menemukan comment');
        }
        if (userId !== 'user-123') {
          throw new ForbiddenError('access data tidak diperbolehkan');
        }
        return Promise.resolve();
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
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExistAndOwnedByUser)
      .toBeCalledWith(validUserId, validUseCasePayload);
    expect(mockThreadCommentRepository.softDeleteCommentById).toBeCalledWith(validUseCasePayload);

    await expect(getThreadCommentUseCase.execute(validUserId, invalidThreadId, validUseCasePayload))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentUseCase.execute(validUserId, validThreadId, invalidUseCasePayload))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExistAndOwnedByUser)
      .toBeCalledWith(validUserId, invalidUseCasePayload);

    await expect(getThreadCommentUseCase.execute(invalidUserId, validThreadId, validUseCasePayload))
      .rejects.toThrow(ForbiddenError);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExistAndOwnedByUser)
      .toBeCalledWith(invalidUserId, validUseCasePayload);
  });
});