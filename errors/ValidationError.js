class ValidationError extends Error {
  constructor(message, { code, params } = {}) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.code = code;
    this.params = params;
  }
}

export default ValidationError;
