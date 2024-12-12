const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CreatedThreadComment = require('../../../Domains/thread-comments/entities/CreatedThreadComment');
const ThreadCommentRepository = require('../../../Domains/thread-comments/ThreadCommentRepository');
const AddThreadCommentUseCase = require('../AddThreadCommentUseCase');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread comment action correctly', async () => {
    const userIdPayload = 'user-123';
    const validThreadId = 'thread-123';
    const invalidThreadId = 'thread-12';
    const useCasePayload = {
      content: 'test content',
    };

    const dummyCreatedThreadComment = new CreatedThreadComment({
      id: 'test-123',
      content: 'test content',
      owner: 'hidayah'
    });

    const mockThreadRepository = new ThreadRepository();
    const mockThreadCommentRepository = new ThreadCommentRepository();

    mockThreadRepository.verifyThreadExistById = 
      jest.fn().mockImplementation((threadId) => {
        if (threadId !== 'thread-123') {
          throw new NotFoundError('tidak dapat menemukan thread');
        }
        return Promise.resolve();
      });
    mockThreadCommentRepository.addComment =
      jest.fn().mockImplementation(() => Promise.resolve(dummyCreatedThreadComment));

    const getThreadCommentUseCase = new AddThreadCommentUseCase({
      threadRepository: mockThreadRepository,
      threadCommentRepository: mockThreadCommentRepository,
    });

    const createdThreadComment = await getThreadCommentUseCase
      .execute(userIdPayload, validThreadId, useCasePayload);

    expect(createdThreadComment).toStrictEqual(new CreatedThreadComment({
      id: 'test-123',
      content: 'test content',
      owner: 'hidayah'
    }));
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.addComment).toBeCalledWith(
      userIdPayload,
      validThreadId,
      useCasePayload,
    );

    await expect(getThreadCommentUseCase.execute(userIdPayload, invalidThreadId, useCasePayload))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.verifyThreadExistById).toBeCalledWith(invalidThreadId);
  });
});