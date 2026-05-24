import * as authService from '../services/auth.service.js';

const register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const token = await authService.register(username, password, email);
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const token = await authService.login(username, password);
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

export { register, login };
