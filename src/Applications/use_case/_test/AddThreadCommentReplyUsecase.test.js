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
    mockThreadCommentReplyRepository.addCommentReply = jest.fn()
      .mockImplementation(() => Promise.resolve(mockCreatedThreadCommentReply));

    const getThreadCommentReplyUseCase = new AddThreadCommentReplyUseCase({
      threadRepository: mockThreadRepository,
      threadCommentRepository: mockThreadCommentRepository,
      threadCommentReplyRepository: mockThreadCommentReplyRepository,
    });

    const createdThreadCommentReply = await getThreadCommentReplyUseCase
      .execute(userIdPayload, validThreadId, validCommentId, useCasePayload);

    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExist).toBeCalledWith(validCommentId);
    expect(createdThreadCommentReply).toStrictEqual(mockCreatedThreadCommentReply);
    expect(mockThreadCommentReplyRepository.addCommentReply).toBeCalledWith(
      userIdPayload,
      validCommentId,
      useCasePayload,
    );

    await expect(getThreadCommentReplyUseCase.execute(
      userIdPayload, invalidThreadId, validCommentId, useCasePayload,
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(invalidThreadId);

    await expect(getThreadCommentReplyUseCase.execute(
      userIdPayload, validThreadId, invalidCommentId, useCasePayload,
    )).rejects.toThrow(Error);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.verifyCommentExist).toBeCalledWith(invalidCommentId);
  });
});