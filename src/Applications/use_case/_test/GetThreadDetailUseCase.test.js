const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const ThreadCommentReplyRepository = require('../../../Domains/thread-comment-replies/ThreadCommentReplyRepository');
const ThreadCommentRepository = require('../../../Domains/thread-comments/ThreadCommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');

describe('GetThreadDetailUseCase', () =>{
  it('should orchestrating the get thread detail with comment and reply action correctly', async () => {
    const mockThread = {
      id: 'thread-123',
      created_at: new Date(),
      title: 'Title Test',
      body: 'Body test',
      username: 'username123',
      fullname: 'Fullname Test',
      user_id: 'user-123'
    };
    const mockCommentsResult = [
      {
        id: 'comment-123',
        created_at: new Date(),
        is_delete: false,
        deleted_at: null,
        content: 'content test',
        username: 'username123',
        fullname: 'Fullname Test',
        thread_id: 'thread-123',
      },
      {
        id: 'comment-123-2',
        created_at: new Date(),
        is_delete: true,
        deleted_at: new Date(),
        content: 'content test 2',
        username: 'username123',
        fullname: 'Fullname Test',
        thread_id: 'thread-123'
      },
    ];
    const mockRepliesResultComment = [
      {
        id: 'reply-123',
        created_at: new Date(),
        is_delete: false,
        deleted_at: null,
        content: 'content test',
        username: 'username123',
        fullname: 'Fullname Test',
        thread_comment_id: 'comment-123',
      },
      {
        id: 'reply-123-2',
        created_at: new Date(),
        is_delete: true,
        deleted_at: new Date(),
        content: 'content test 2',
        username: 'username123',
        fullname: 'Fullname Test',
        thread_comment_id: 'comment-123',
      },
    ]

    const mockThreadRepository = new ThreadRepository();
    const mockThreadCommentRepository = new ThreadCommentRepository();
    const mockThreadCommentReplyRepository = new ThreadCommentReplyRepository();

    const useCasePayload = 'thread-123';

    mockThreadRepository.getThreadsWithUser =
      jest.fn().mockImplementation(() => Promise.resolve(mockThread));
    mockThreadCommentRepository.getCommentsWithUserFromThread =
      jest.fn().mockImplementation(() => Promise.resolve(mockCommentsResult));
    mockThreadCommentReplyRepository.getReplyWithUserFromComment =
      jest.fn().mockImplementation((commentId) => {
        if (commentId === 'comment-123-2') {
          return Promise.resolve(mockRepliesResultComment)
        }
        return [];
      });

    const getThreadUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      threadCommentRepository: mockThreadCommentRepository,
      threadCommentReplyRepository: mockThreadCommentReplyRepository,
    });

    const threadDetail = await getThreadUseCase.execute(useCasePayload);

    expect(threadDetail.id).toBe('thread-123');
    expect(threadDetail.title).toBe('Title Test');
    expect(threadDetail.body).toBe('Body test');
    expect(threadDetail.date).toBeDefined();;
    expect(threadDetail.username).toBe('username123');
    expect(threadDetail.comments.length).toBe(2);

    expect(threadDetail.comments[0].id).toBe('comment-123');
    expect(threadDetail.comments[0].username).toBe('username123');
    expect(threadDetail.comments[0].date).toBeDefined();
    expect(threadDetail.comments[0].content).toBe('content test');
    expect(threadDetail.comments[0].replies.length).toBe(2);

    expect(threadDetail.comments[1].id).toBe('comment-123-2');
    expect(threadDetail.comments[1].username).toBe('username123');
    expect(threadDetail.comments[1].date).toBeDefined();
    expect(threadDetail.comments[1].content).toBe('**komentar telah dihapus**');
    expect(threadDetail.comments[1].replies.length).toBe(0);

    expect(threadDetail.comments[0].replies[0].id).toBe('reply-123');
    expect(threadDetail.comments[0].replies[0].username).toBe('username123');
    expect(threadDetail.comments[0].replies[0].date).toBeDefined();
    expect(threadDetail.comments[0].replies[0].content).toBe('content test');

    expect(threadDetail.comments[0].replies[1].id).toBe('reply-123-2');
    expect(threadDetail.comments[0].replies[1].username).toBe('username123');
    expect(threadDetail.comments[0].replies[1].date).toBeDefined();
    expect(threadDetail.comments[0].replies[1].content).toBe('**balasan telah dihapus**');
  });

  it('should orchestrating the get thread detail if thread is not found', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockThreadCommentRepository = new ThreadCommentRepository();
    const mockThreadCommentReplyRepository = new ThreadCommentReplyRepository();
    const useCasePayload = 'thread-id-123';

    const dummyQueryResult = [];

    mockThreadRepository.getThreadsWithUser =
      jest.fn().mockImplementation(() => Promise.resolve(dummyQueryResult));

    const getThreadUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      threadCommentReplyRepository: mockThreadCommentRepository,
      threadCommentRepository: mockThreadCommentReplyRepository,
    });
    
    await expect(getThreadUseCase.execute(useCasePayload)).rejects.toThrow(Error);
    expect(mockThreadRepository.getThreadsWithUser).toBeCalledWith(useCasePayload);
  });
});