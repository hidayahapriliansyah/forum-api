const CreateThreadComment = require('../CreateThreadComment');

describe('a CreateThreadComment entities', () => {
  it('should throw error if payload not contain needed property', () => {
    // payload content: string;
    const payload = {};

    expect(() => new CreateThreadComment(payload))
      .toThrowError('CREATE_THREAD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = { content: 123 };

    expect(() => new CreateThreadComment(payload))
      .toThrowError('CREATE_THREAD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create createThreadComment object correctly', () => {
    const payload = { content: 'content test' };

    const { content } = new CreateThreadComment(payload);

    expect(content).toBe(payload.content);
  });
})