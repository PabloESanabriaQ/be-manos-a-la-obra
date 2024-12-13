class UsernameAlreadyExistsError extends Error {
  constructor(message = 'Username already exists') {
    super(message);
    this.name = 'UsernameAlreadyExistsError';
    this.status = 400;
  }
}

module.exports = UsernameAlreadyExistsError;