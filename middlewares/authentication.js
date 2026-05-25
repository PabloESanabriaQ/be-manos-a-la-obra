import jwt from 'jsonwebtoken';
import User from '../models/users.model.js';

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ mensaje: 'There is no token, authentication denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id, 'role active');

    if (!user) {
      return res.status(401).json({ mensaje: 'Invalid token' });
    }

    if (!user.active) {
      return res.status(403).json({ error: true, name: 'ForbiddenError', message: 'Account is deactivated' });
    }

    req.userId = decoded.id;
    req.userRole = user.role;
    next();
  } catch {
    return res.status(401).json({ mensaje: 'Invalid token' });
  }
};

export default authMiddleware;
