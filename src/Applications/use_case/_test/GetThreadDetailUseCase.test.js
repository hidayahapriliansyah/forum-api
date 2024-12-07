const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');

describe('GetThreadDetailUseCase', () =>{
  it('should orchestrating the get thread detail with comment and reply action correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    const useCasePayload = 'thread-id-123';

    const mockQueryResult = {
      rows: [
        {
          thread_id: 'thread-AqVg2b9JyQXR6wSQ2TmH4',
          thread_title: 'sebuah thread',
          thread_body: 'sebuah body thread',
          thread_date: '2021-08-08T07:59:16.198Z',
          thread_username: 'dicoding',
          comment_id: 'comment-q_0uToswNf6i24RDYZJI3',
          comment_username: 'dicoding',
          comment_date: '2021-08-08T07:59:18.982Z',
          comment_is_delete: false,
          comment_content: 'sebuah comment',
          reply_id: 'reply-BErOXUSefjwWGW1Z10Ihk',
          reply_content: '**balasan telah dihapus**',
          reply_date: '2021-08-08T07:59:48.766Z',
          reply_username: 'johndoe',
          reply_is_delete: true
        },
        {
          thread_id: 'thread-AqVg2b9JyQXR6wSQ2TmH4',
          thread_title: 'sebuah thread',
          thread_body: 'sebuah body thread',
          thread_date: '2021-08-08T07:59:16.198Z',
          thread_username: 'dicoding',
          comment_id: 'comment-q_0uToswNf6i24RDYZJI3',
          comment_username: 'dicoding',
          comment_date: '2021-08-08T07:59:18.982Z',
          comment_is_delete: false,
          comment_content: 'sebuah comment',
          reply_id: 'reply-xNBtm9HPR-492AeiimpfN',
          reply_content: 'sebuah balasan',
          reply_date: '2021-08-08T08:07:01.522Z',
          reply_username: 'dicoding',
          reply_is_delete: false
        },
        {
          thread_id: 'thread-AqVg2b9JyQXR6wSQ2TmH4',
          thread_title: 'sebuah thread',
          thread_body: 'sebuah body thread',
          thread_date: '2021-08-08T07:59:16.198Z',
          thread_username: 'dicoding',
          comment_id: 'comment-q_20uToswNf6i24RDYZJI3',
          comment_username: 'dicoding',
          comment_date: '2021-08-08T07:59:18.982Z',
          comment_is_delete: true,
          comment_content: 'sebuah comment',
          reply_id: 'reply-xNBtm9HPR-492AeiimpfN',
          reply_content: 'sebuah balasan',
          reply_date: '2021-08-08T08:07:01.522Z',
          reply_username: 'dicoding',
          reply_is_delete: false
        },
        {
          thread_id: 'thread-AqVg2b9JyQXR6wSQ2TmH4',
          thread_title: 'sebuah thread',
          thread_body: 'sebuah body thread',
          thread_date: '2021-08-08T07:59:16.198Z',
          thread_username: 'dicoding',
          comment_id: 'comment-q_20uToswNf6i24RDYZJI3',
          comment_username: 'dicoding',
          comment_date: '2021-08-08T07:59:18.982Z',
          comment_is_delete: true,
          comment_content: 'sebuah comment',
          reply_id: null,
          reply_content: null,
          reply_date: null,
          reply_username: null,
          reply_is_delete: false
        }
      ]
    }
    const mockThreadDataDetail = {
      id: 'thread-AqVg2b9JyQXR6wSQ2TmH4',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:59:16.198Z',
      username: 'dicoding',
      comments: [
        {
          id: 'comment-q_0uToswNf6i24RDYZJI3',
          username: 'dicoding',
          date: '2021-08-08T07:59:18.982Z',
          replies: [
            {
              id: 'reply-BErOXUSefjwWGW1Z10Ihk',
              content: '**balasan telah dihapus**',
              date: '2021-08-08T07:59:48.766Z',
              username: 'johndoe'
            },
            {
              id: 'reply-xNBtm9HPR-492AeiimpfN',
              content: 'sebuah balasan',
              date: '2021-08-08T08:07:01.522Z',
              username: 'dicoding'
            }
          ],
          content: 'sebuah comment'
        },
        {
          "content": "**komentar telah dihapus**",
          "date": "2021-08-08T07:59:18.982Z",
          "id": "comment-q_20uToswNf6i24RDYZJI3",
          "replies": [
            {
              "content": "sebuah balasan",
              "date": "2021-08-08T08:07:01.522Z",
              "id": "reply-xNBtm9HPR-492AeiimpfN",
              "username": "dicoding",
            },
          ],
          "username": "dicoding",
        }
      ]
    };


    mockThreadRepository.getThreadDetailWithCommentReply =
      jest.fn().mockImplementation(() => Promise.resolve(mockQueryResult));

    const getThreadUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    const foundThread = await getThreadUseCase.execute(useCasePayload);
    expect(foundThread).toStrictEqual(mockThreadDataDetail);
    expect(mockThreadRepository.getThreadDetailWithCommentReply).toBeCalledWith(useCasePayload);
  });

  it('should orchestrating the get thread detail if thread is not found', async () => {
    const mockThreadRepository = new ThreadRepository();
    const useCasePayload = 'thread-id-123';

    const dummyQueryResult = { rows: [] };

    mockThreadRepository.getThreadDetailWithCommentReply =
      jest.fn().mockImplementation(() => Promise.resolve(dummyQueryResult));

    const getThreadUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });
    
    await expect(getThreadUseCase.execute(useCasePayload)).rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.getThreadDetailWithCommentReply).toBeCalledWith(useCasePayload);
  });
});