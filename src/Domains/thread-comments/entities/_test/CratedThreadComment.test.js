const CreatedThreadComment = require('../CreatedThreadComment');

describe('a CreatedThreadComment entities', () => {
  it('should throw error if payload not contain needed property', () => {
    // required id string, content string, owner string
    const payload = { id: 'test id', content: 'test content' };

    expect(() => new CreatedThreadComment(payload))
      .toThrowError('CREATED_THREAD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = { id: true, content: 123, owner: [] };

    expect(() => new CreatedThreadComment(payload))
      .toThrowError('CREATED_THREAD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create createdThreadComment object correctly', () => {
    const payload = { id: 'test-id', content: 'content test', owner: 'owner test' };

    const { id, content, owner } = new CreatedThreadComment(payload);

    expect(id).toBe(payload.id);
    expect(content).toBe(payload.content);
    expect(owner).toBe(payload.owner);
  });
})