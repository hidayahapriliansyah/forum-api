const CreateThread = require('../../Domains/threads/entities/CreateThread');

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(userIdPayload, useCasePayload) {
    const createThread = new CreateThread(useCasePayload);
    return await this._threadRepository.addThread(userIdPayload, createThread);
  }
}

module.exports = AddThreadUseCase;