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
            body: 'test body',
            title: 'test title',
            created_at: new Date(),
            user_id: 'user-123',
          }
          : null;
      });
    mockThreadCommentRepository.findCommentById =
      jest.fn().mockImplementation((commentId) => {
        return commentId == 'comment-123'
          ? {
            id: 'comment-123',
            created_at: new Date(),
            deleted_at: null,
            is_delete: false,
            user_id: 'user-123',
            content: 'test body',
            thread_id: 'thread-123'
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
    expect(mockThreadRepository.findThreadById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.findCommentById).toBeCalledWith(validUseCasePayload);
    expect(mockThreadCommentRepository.softDeleteCommentById).toBeCalledWith(validUseCasePayload);

    await expect(getThreadCommentUseCase.execute(validUserId, invalidThreadId, validUseCasePayload))
      .rejects.toThrow(Error);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentUseCase.execute(validUserId, validThreadId, invalidUseCasePayload))
      .rejects.toThrow(Error);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.findCommentById).toBeCalledWith(invalidUseCasePayload);

    await expect(getThreadCommentUseCase.execute(invalidUserId, validThreadId, validUseCasePayload))
      .rejects.toThrow(Error);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.findCommentById).toBeCalledWith(validUseCasePayload);
  });
});