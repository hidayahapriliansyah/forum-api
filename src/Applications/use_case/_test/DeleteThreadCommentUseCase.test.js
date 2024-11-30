const ThreadCommentRepository = require('../../../Domains/thread-comments/ThreadCommentRepository');
const DeleteThreadCommentUseCase = require('../DeleteThreadCommentUseCase');

describe('DeleteThreadCommentUseCase', () =>  {
  it('should orchestrating the delete thread comment action correctly', async () => {
    const userIdPayload = 'user-123';
    const threadIdPayload = 'threadIdPayload';

    const useCasePayload = 'mockThreadIduseCasePayload';

    const mockThreadCommentRepository = new ThreadCommentRepository();

    mockThreadCommentRepository.softDeleteCommentById = jest.fn().mockImplementation(() => Promise.resolve(useCasePayload));

    const getThreadCommentUseCase = new DeleteThreadCommentUseCase({
      threadCommentRepository: mockThreadCommentRepository,
    });

    const deletedThreadComment = await getThreadCommentUseCase
      .execute(userIdPayload, threadIdPayload, useCasePayload);

    expect(deletedThreadComment).toStrictEqual(useCasePayload);
    expect(mockThreadCommentRepository.softDeleteCommentById).toBeCalledWith(
      userIdPayload,
      threadIdPayload,
      useCasePayload,
    );
  });
});