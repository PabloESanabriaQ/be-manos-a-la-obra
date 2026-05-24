import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/users.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import UsernameAlreadyExistsError from '../errors/UsernameAlreadyExistsError.js';
import InvalidCredentialsError from '../errors/InvalidCredentialsError.js';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const generateTokens = async (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const rawToken = crypto.randomBytes(64).toString('hex');
  await new RefreshToken({
    token: rawToken,
    user: userId,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  }).save();
  return { accessToken, refreshToken: rawToken };
};

const register = async (username, password, email) => {
  const existing = await User.findOne({ username });
  if (existing) throw new UsernameAlreadyExistsError();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await new User({ username, email, password: hashedPassword }).save();

  return generateTokens(user._id);
};

const login = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) throw new InvalidCredentialsError();

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new InvalidCredentialsError();

  return generateTokens(user._id);
};

const refresh = async (token) => {
  if (!token) throw new InvalidCredentialsError('Refresh token requerido');

  const stored = await RefreshToken.findOne({ token });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await RefreshToken.deleteOne({ token });
    throw new InvalidCredentialsError('Refresh token inválido o expirado');
  }

  await RefreshToken.deleteOne({ token });
  return generateTokens(stored.user);
};

const logout = async (token) => {
  if (token) await RefreshToken.deleteOne({ token });
};

export { register, login, refresh, logout };
