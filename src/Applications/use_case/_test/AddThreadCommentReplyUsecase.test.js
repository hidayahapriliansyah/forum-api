const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const CreatedThreadCommentReply = require('../../../Domains/thread-comment-replies/entities/CreatedThreadCommentReply');
const ThreadCommentReplyRepository = require('../../../Domains/thread-comment-replies/ThreadCommentReplyRepository');
const ThreadCommentRepository = require('../../../Domains/thread-comments/ThreadCommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddThreadCommentReplyUseCase = require('../AddThreadCommentReplyUsecase');

describe('AddThreadCommentReplyUseCase', () => {
  it('should orchestrating the add thread comment reply action correctly', async () => {
    const userIdPayload = 'user-123';
    const validThreadId = 'thread-123';
    const invalidThreadId = 'thread-12';
    const validCommentId = 'comment-123';
    const invalidCommentId = 'comment-12';
    const useCasePayload = {
      content: 'test content',
    };

    const mockCreatedThreadCommentReply = new CreatedThreadCommentReply({
      id: 'test-123',
      content: 'test content',
      owner: 'hidayah'
    })

    const mockThreadRepository = new ThreadRepository();
    const mockThreadCommentRepository = new ThreadCommentRepository();
    const mockThreadCommentReplyRepository = new ThreadCommentReplyRepository();

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
    mockThreadCommentReplyRepository.addCommentReply = jest.fn()
      .mockImplementation(() => Promise.resolve(mockCreatedThreadCommentReply));

    const getThreadCommentReplyUseCase = new AddThreadCommentReplyUseCase({
      threadRepository: mockThreadRepository,
      threadCommentRepository: mockThreadCommentRepository,
      threadCommentReplyRepository: mockThreadCommentReplyRepository,
    });

    const createdThreadCommentReply = await getThreadCommentReplyUseCase
      .execute(userIdPayload, validThreadId, validCommentId, useCasePayload);

    expect(createdThreadCommentReply).toStrictEqual(mockCreatedThreadCommentReply);
    expect(mockThreadCommentReplyRepository.addCommentReply).toBeCalledWith(
      userIdPayload,
      validCommentId,
      useCasePayload,
    );

    await expect(getThreadCommentReplyUseCase.execute(
      userIdPayload, invalidThreadId, validCommentId, useCasePayload,
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentReplyUseCase.execute(
      userIdPayload, validThreadId, invalidCommentId, useCasePayload,
    )).rejects.toThrow(Error);
    expect(mockThreadCommentRepository.findCommentById).toBeCalledWith(invalidCommentId);
  });
});