class GetThreadDetailUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    return await this._threadRepository.findThreadById(useCasePayload);
  }
}

module.exports = GetThreadDetailUseCase;