import * as authService from '../services/auth.service.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 12 * 60 * 60 * 1000,
};

const register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const token = await authService.register(username, password, email);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const token = await authService.login(username, password);
    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({ message: 'Login exitoso' });
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logout exitoso' });
};

export { register, login, logout };
