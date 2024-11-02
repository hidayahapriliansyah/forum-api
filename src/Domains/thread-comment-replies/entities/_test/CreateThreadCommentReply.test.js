const CreateThreadCommentReply = require('../CreateThreadCommentReply');

describe('a CreateThreadCommentReply entities', () => {
  it('should throw error if payload not contain needed property', () => {
    // payload content: string;
    const payload = {};

    expect(() => new CreateThreadCommentReply(payload))
      .toThrowError('CREATE_THREAD_COMMENT_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = { content: 123 };

    expect(() => new CreateThreadCommentReply(payload))
      .toThrowError('CREATE_THREAD_COMMENT_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create createThreadCommentCreateThreadCommentReply object correctly', () => {
    const payload = { content: 'content test' };

    const { content } = new CreateThreadCommentReply(payload);

    expect(content).toBe(payload.content);
  });
})