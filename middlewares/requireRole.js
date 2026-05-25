import ForbiddenError from '../errors/ForbiddenError.js';

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) {
    return next(new ForbiddenError('Insufficient permissions'));
  }
  next();
};

export default requireRole;
