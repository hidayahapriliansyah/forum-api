const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');

describe('GetThreadDetailUseCase', () =>{
  it('should orchestrating the find thread action correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    const useCasePayload = 'threadId';
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
            }
        ]
    };

    mockThreadRepository.findThreadById = jest.fn().mockImplementation(() => Promise.resolve(mockThreadDataDetail));

    const getThreadUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
    });

    const foundThread = await getThreadUseCase.execute(useCasePayload);

    expect(foundThread).toStrictEqual(mockThreadDataDetail);
    expect(mockThreadRepository.findThreadById).toBeCalledWith(useCasePayload);
  });
});