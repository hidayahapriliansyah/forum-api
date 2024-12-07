const AddThreadUseCase = require('../AddThreadUseCase');
const CreatedThead = require('../../../Domains/threads/entities/CreatedThread');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CreatedThreadComment = require('../../../Domains/thread-comments/entities/CreatedThreadComment');
const ThreadCommentRepository = require('../../../Domains/thread-comments/ThreadCommentRepository');
const AddThreadCommentUseCase = require('../AddThreadCommentUseCase');

describe('AddThreadUseCase', () => {
  it('should orchestrating the add thread comment action correctly', async () => {
    const userIdPayload = 'user-123';
    const threadIdPayload = 'thread-123';
    const useCasePayload = {
      content: 'test content',
    };

    const dummyCreatedThreadComment = new CreatedThreadComment({
      id: 'test-123',
      content: 'test content',
      owner: 'hidayah'
    });

    const mockThreadCommentRepository = new ThreadCommentRepository();

    mockThreadCommentRepository.addComment =
      jest.fn().mockImplementation(() => Promise.resolve(dummyCreatedThreadComment));

    const getThreadCommentUseCase = new AddThreadCommentUseCase({
      threadCommentRepository: mockThreadCommentRepository,
    });

    const createdThreadComment = await getThreadCommentUseCase
      .execute(userIdPayload, threadIdPayload, useCasePayload);

    expect(createdThreadComment).toStrictEqual(new CreatedThreadComment({
      id: 'test-123',
      content: 'test content',
      owner: 'hidayah'
    }));
    expect(mockThreadCommentRepository.addComment).toBeCalledWith(
      userIdPayload,
      threadIdPayload,
      useCasePayload,
    );
  });
});