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

    mockThreadRepository.findThreadById = 
      jest.fn().mockImplementation((threadId) => {
        return threadId == 'thread-123'
          ? {
            id: 'thread-123',
            body: 'test body',
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
    mockThreadCommentReplyRepository.softDeleteCommentReplyById = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadCommentReplyRepository.findReplyById =
      jest.fn().mockImplementation((replyId) => {
        return replyId === 'reply-123' 
          ? {
            id: 'reply-123',
            created_at: new Date(),
            deleted_at: null,
            is_delete: false,
            user_id: 'user-123',
            thread_comment_id: 'thread-123',
            content: 'test content',
          }
          : null;
      });

    const getThreadCommentReplyUseCase = new DeleteThreadCommentReplyUseCase({
      threadRepository: mockThreadRepository,
      threadCommentRepository: mockThreadCommentRepository,
      threadCommentReplyRepository: mockThreadCommentReplyRepository,
    });

    const deletedThreadComment = await getThreadCommentReplyUseCase
      .execute(validUserId, validThreadId, validCommentId, validUseCasePayload);

    expect(deletedThreadComment).toStrictEqual(undefined);
    expect(mockThreadCommentReplyRepository.softDeleteCommentReplyById).toBeCalledWith(
      validUseCasePayload
    );

    await expect(getThreadCommentReplyUseCase.execute(
      validUserId, invalidThreadId, validCommentId, validUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentReplyUseCase.execute(
      validUserId, validThreadId, invalidCommentId, validUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadCommentRepository.findCommentById).toBeCalledWith(invalidCommentId);

    await expect(getThreadCommentReplyUseCase.execute(
      validUserId, validThreadId, validCommentId, invalidUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadCommentReplyRepository.findReplyById).toBeCalledWith(invalidUseCasePayload);

    await expect(getThreadCommentReplyUseCase.execute(
      invalidUserId, validThreadId, validCommentId, validUseCasePayload
    )).rejects.toThrow(Error);
    expect(mockThreadCommentReplyRepository.findReplyById).toBeCalledWith(validUseCasePayload);
  });
});