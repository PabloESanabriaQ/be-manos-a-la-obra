import * as authService from '../services/auth.service.js';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie('token', accessToken, { ...BASE_COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...BASE_COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

const register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const tokens = await authService.register(username, password, email);
    setAuthCookies(res, tokens);
    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const tokens = await authService.login(username, password);
    setAuthCookies(res, tokens);
    res.json({ message: 'Login exitoso' });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.cookies?.refreshToken);
    setAuthCookies(res, tokens);
    res.json({ message: 'Token renovado' });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.cookies?.refreshToken);
    res.clearCookie('token', BASE_COOKIE_OPTIONS);
    res.clearCookie('refreshToken', BASE_COOKIE_OPTIONS);
    res.json({ message: 'Logout exitoso' });
  } catch (err) {
    next(err);
  }
};

export { register, login, refresh, logout };
