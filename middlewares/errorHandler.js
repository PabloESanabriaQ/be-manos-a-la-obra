import logger from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  if (status >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url } }, err.message);
  } else {
    logger.warn({ err, req: { method: req.method, url: req.url } }, err.message);
  }

  res.status(status).json({
    error: true,
    name: err.name,
    message: err.message || 'Internal Server Error',
  });
};

export default errorHandler;
