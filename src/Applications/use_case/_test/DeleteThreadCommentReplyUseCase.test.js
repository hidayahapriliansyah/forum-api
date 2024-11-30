const ThreadCommentReplyRepository = require('../../../Domains/thread-comment-replies/ThreadCommentReplyRepository');
const DeleteThreadCommentReplyUseCase = require('../DeleteThreadCommentReplyUseCase');

describe('DeleteThreadCommentReplyUseCase', () =>  {
  it('should orchestrating the delete thread comment reply action correctly', async () => {
    const userIdPayload = 'user-123';
    const threadIdPayload = 'threadIdPayload';
    const threadCommentIdPayload = 'threadCommentReplyIdPayload';

    const useCasePayload = 'mockThreadIduseCasePayload';

    const mockThreadCommentReplyRepository = new ThreadCommentReplyRepository();

    mockThreadCommentReplyRepository.softDeleteCommentReplyById = jest.fn()
      .mockImplementation(() => Promise.resolve(useCasePayload));

    const getThreadCommentReplyUseCase = new DeleteThreadCommentReplyUseCase({
      threadCommentReplyRepository: mockThreadCommentReplyRepository,
    });

    const deletedThreadComment = await getThreadCommentReplyUseCase
      .execute(userIdPayload, threadIdPayload, threadCommentIdPayload, useCasePayload);

    expect(deletedThreadComment).toStrictEqual(useCasePayload);
    expect(mockThreadCommentReplyRepository.softDeleteCommentReplyById).toBeCalledWith(
      userIdPayload,
      threadIdPayload,
      threadCommentIdPayload,
      useCasePayload,
    );
  });
});