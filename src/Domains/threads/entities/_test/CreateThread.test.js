const CreateThread = require('../CreateThread');

describe('a CreateThread entities', () => {
  it('should throw error if payload not contain needed property', () => {
    const payload = {
      title: 'test title',
    }

    expect(() => new CreateThread(payload)).toThrowError('CREATE_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      title: 123,
      body: true,
    };

    expect(() => new CreateThread(payload)).toThrowError('CREATE_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create createThread object correctly', () => {
    const payload = {
      title: 'test title',
      body: 'test body',
    }

    const { title, body } = new CreateThread(payload);
    
    expect(title).toBe(payload.title);
    expect(body).toBe(payload.body);
  });
});