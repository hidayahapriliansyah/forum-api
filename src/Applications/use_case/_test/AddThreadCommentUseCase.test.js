const AddThreadUseCase = require('../AddThreadUseCase');
const CreatedThead = require('../../../Domains/threads/entities/CreatedThread');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
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

    mockThreadRepository.findThreadById = 
      jest.fn().mockImplementation((threadId) => {
        return threadId == 'thread-123'
          ? {
            id: 'thread-123',
            body: 'test body'
          }
          : null;
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
    expect(mockThreadRepository.findThreadById).toBeCalledWith(validThreadId);
    expect(mockThreadCommentRepository.addComment).toBeCalledWith(
      userIdPayload,
      validThreadId,
      useCasePayload,
    );

    await expect(getThreadCommentUseCase.execute(userIdPayload, invalidThreadId, useCasePayload))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(invalidThreadId);
  });
});