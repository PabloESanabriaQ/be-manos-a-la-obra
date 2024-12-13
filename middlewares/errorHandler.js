const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
      error: true,
      name: err.name,
      message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
