class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid credentials') {
    super(message);
    this.name = 'InvalidCredentialsError';
    this.status = 400;
  }
}

module.exports = InvalidCredentialsError;