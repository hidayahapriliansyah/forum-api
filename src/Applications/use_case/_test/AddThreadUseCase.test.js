const AddThreadUseCase = require('../AddThreadUseCase');
const CreatedThead = require('../../../Domains/threads/entities/CreatedThread');
const CreateThread = require('../../../Domains/threads/entities/CreateThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');


describe('AddThreadUseCase', () => {
  it('should orchestrating the add user action correctly', async () => {
    const userIdPayload = 'user-123'
    const useCasePayload = {
      title: 'test title',
      body: 'test body',
    };

    const mockCreatedThread = new CreatedThead({
      id: 'test-123',
      title: useCasePayload.title,
      owner: 'test owner',
    });

    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.addThread = jest.fn().mockImplementation(() => Promise.resolve(mockCreatedThread));

    const getThreadUseCase = new AddThreadUseCase({
      threadRepository: mockThreadRepository,
    });

    const createdThread = await getThreadUseCase.execute(userIdPayload, useCasePayload);

    expect(createdThread).toStrictEqual(new CreatedThead({
      id: 'test-123',
      title: useCasePayload.title,
      owner: 'test owner',
    }));
    expect(mockThreadRepository.addThread).toBeCalledWith(
      userIdPayload,
      new CreateThread({
        title: useCasePayload.title,
        body: useCasePayload.body,
      })
    );
  });
});