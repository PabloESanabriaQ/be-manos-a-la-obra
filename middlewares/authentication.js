const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ mensaje: 'There is no token, authentication denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({ mensaje: 'Invalid token' });
    }
    req.userId = decoded.id;
    next();
  });
}

module.exports = authMiddleware;