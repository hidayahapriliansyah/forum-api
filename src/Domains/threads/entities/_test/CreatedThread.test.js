const CreatedThread = require('../CreatedThread');

describe('a CreatedThread entities', () => { 
  it('should throw error if payload not contain needed property', () => {
    // required id string, title string, owner string
    const payload = {
      id: 'id-test',
      title: 'title test',
    };

    expect(() => new CreatedThread(payload)).toThrowError('CREATED_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 123,
      title: [],
      owner: true
    };

    expect(() => new CreatedThread(payload)).toThrowError('CREATED_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create createThread object correctly', () => {
    const payload = {
      id: 'id-test',
      title: 'title test',
      owner: 'owner test',
    };

    const { id, title, owner } = new CreatedThread(payload);
    
    expect(id).toBe(payload.id);
    expect(title).toBe(payload.title);
    expect(owner).toBe(payload.owner);
  });
})