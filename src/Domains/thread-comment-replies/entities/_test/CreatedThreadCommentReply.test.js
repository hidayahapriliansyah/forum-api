const CreatedThreadCommentReply = require('../CreatedThreadCommentReply');

describe('a CreatedThreadCommentReply entities', () => {
  it('should throw error if payload not contain needed property', () => {
    // required id string, content string, owner string
    const payload = { id: 'test id', content: 'test content' };

    expect(() => new CreatedThreadCommentReply(payload))
      .toThrowError('CREATED_THREAD_COMMENT_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = { id: true, content: 123, owner: [] };

    expect(() => new CreatedThreadCommentReply(payload))
      .toThrowError('CREATED_THREAD_COMMENT_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create createdThreadCommentReply object correctly', () => {
    const payload = { id: 'test-id', content: 'content test', owner: 'owner test' };

    const { id, content, owner } = new CreatedThreadCommentReply(payload);

    expect(id).toBe(payload.id);
    expect(content).toBe(payload.content);
    expect(owner).toBe(payload.owner);
  });
})