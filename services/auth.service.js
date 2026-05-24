import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/users.model.js';
import UsernameAlreadyExistsError from '../errors/UsernameAlreadyExistsError.js';
import InvalidCredentialsError from '../errors/InvalidCredentialsError.js';

const register = async (username, password, email) => {
  const existing = await User.findOne({ username });
  if (existing) throw new UsernameAlreadyExistsError();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await new User({ username, email, password: hashedPassword }).save();

  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

const login = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) throw new InvalidCredentialsError();

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new InvalidCredentialsError();

  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

export { register, login };
