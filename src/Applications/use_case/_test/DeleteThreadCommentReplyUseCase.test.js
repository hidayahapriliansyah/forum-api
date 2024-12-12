const ThreadCommentReplyRepository = require('../../../Domains/thread-comment-replies/ThreadCommentReplyRepository');
const ThreadCommentRepository = require('../../../Domains/thread-comments/ThreadCommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteThreadCommentReplyUseCase = require('../DeleteThreadCommentReplyUseCase');

describe('DeleteThreadCommentReplyUseCase', () =>  {
  it('should orchestrating the delete thread comment reply action correctly', async () => {
    const validUserId = 'user-123';
    const invalidUserId = 'user-12';
    const validThreadId = 'thread-123';
    const invalidThreadId = 'thread-12';
    const validCommentId = 'comment-123';
    const invalidCommentId = 'comment-12';
    const validUseCasePayload = 'reply-123';
    const invalidUseCasePayload = 'reply-12';

    const mockThreadRepository = new ThreadRepository();
    const mockThreadCommentRepository = new ThreadCommentRepository();
    const mockThreadCommentReplyRepository = new ThreadCommentReplyRepository();

    mockThreadRepository.verifyThreadExistById = 
      jest.fn().mockImplementation((threadId) => {
        if (threadId !== 'thread-123') {
          throw new NotFoundError('tidak dapat menemukan thread');
        }
        return Promise.resolve();
      });
    mockThreadCommentRepository.verifyCommentExist =
      jest.fn().mockImplementation((commentId) => {
        if (commentId !== 'comment-123') {
          throw new NotFoundError('tidak dapat menemukan comment');
        }
        return Promise.resolve();
      });
    mockThreadCommentReplyRepository.softDeleteCommentReplyById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadCommentReplyRepository.verifyReplyExistAndOwnedByUser =
      jest.fn().mockImplementation((userId, replyId) => {
        if (replyId !== 'reply-123') {
          throw new NotFoundError('tidak dapat menemukan reply');
        }
        if (userId !== 'user-123') {
          throw new ForbiddenError('access data tidak diperbolehkan');
        }
        return Promise.resolve();
      });

    const getThreadCommentReplyUseCase = new DeleteThreadCommentReplyUseCase({
      threadRepository: mockThreadRepository,
      threadCommentRepository: mockThreadCommentRepository,
      threadCommentReplyRepository: mockThreadCommentReplyRepository,
    });

    const deletedThreadComment = await getThreadCommentReplyUseCase
      .execute(validUserId, validThreadId, validCommentId, validUseCasePayload);

    expect(deletedThreadComment).toStrictEqual(undefined);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExist).toBeCalledWith(validCommentId);
    expect(mockThreadCommentReplyRepository.verifyReplyExistAndOwnedByUser)
      .toBeCalledWith(validUserId, validUseCasePayload);
    expect(mockThreadCommentReplyRepository.softDeleteCommentReplyById).toBeCalledWith(
      validUseCasePayload
    );

    await expect(getThreadCommentReplyUseCase.execute(
      validUserId, invalidThreadId, validCommentId, validUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentReplyUseCase.execute(
      validUserId, validThreadId, invalidCommentId, validUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExist).toBeCalledWith(invalidCommentId);

    await expect(getThreadCommentReplyUseCase.execute(
      validUserId, validThreadId, validCommentId, invalidUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExist).toBeCalledWith(validCommentId);
    expect(mockThreadCommentReplyRepository.verifyReplyExistAndOwnedByUser)
      .toBeCalledWith(validUserId, invalidUseCasePayload);

    await expect(getThreadCommentReplyUseCase.execute(
      invalidUserId, validThreadId, validCommentId, validUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExist).toBeCalledWith(validCommentId);
    expect(mockThreadCommentReplyRepository.verifyReplyExistAndOwnedByUser)
      .toBeCalledWith(invalidUserId, validUseCasePayload);
  });
});