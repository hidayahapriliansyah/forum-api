const CreatedThreadCommentReply = require('../../../Domains/thread-comment-replies/entities/CreatedThreadCommentReply');
const ThreadCommentReplyRepository = require('../../../Domains/thread-comment-replies/ThreadCommentReplyRepository');
const AddThreadCommentReplyUseCase = require('../AddThreadCommentReplyUsecase');

describe('AddThreadCommentReplyUseCase', () => {
  it('should orchestrating the add thread comment reply action correctly', async () => {
    const userIdPayload = 'user-123';
    const threadIdPayload = 'thread-123';
    const threadCommentIdPayload = 'thread-comment-123';
    const useCasePayload = {
      content: 'test content',
    };

    const mockCreatedThreadCommentReply = new CreatedThreadCommentReply({
      id: 'test-123',
      content: 'test content',
      owner: 'hidayah'
    })

    const mockThreadCommentReplyRepository = new ThreadCommentReplyRepository();

    mockThreadCommentReplyRepository.addCommentReply = jest.fn()
      .mockImplementation(() => Promise.resolve(mockCreatedThreadCommentReply));

    const getThreadCommentReplyUseCase = new AddThreadCommentReplyUseCase({
      threadCommentReplyRepository: mockThreadCommentReplyRepository,
    });

    const createdThreadCommentReply = await getThreadCommentReplyUseCase
      .execute(userIdPayload, threadIdPayload, threadCommentIdPayload, useCasePayload);

    expect(createdThreadCommentReply).toStrictEqual(mockCreatedThreadCommentReply);
    expect(mockThreadCommentReplyRepository.addCommentReply).toBeCalledWith(
      userIdPayload,
      threadIdPayload,
      threadCommentIdPayload,
      useCasePayload,
    );
  });
});