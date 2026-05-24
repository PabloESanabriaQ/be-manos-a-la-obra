const authService = require('../services/auth.service');

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

module.exports = { register, login };
