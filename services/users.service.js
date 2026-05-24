import bcrypt from 'bcryptjs';
import User from '../models/users.model.js';
import NotFoundError from '../errors/NotFoundError.js';
import InvalidCredentialsError from '../errors/InvalidCredentialsError.js';

const getAll = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    User.find().skip(skip).limit(limit).select('-password'),
    User.countDocuments(),
  ]);
  return { data, total };
};

const getById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

const getByIdWithoutPwd = (id) => User.findById(id).select('-password');

const updatePassword = async (id, currentPassword, newPassword) => {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new InvalidCredentialsError('Current password is incorrect');

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();
};

export { getAll, getById, getByIdWithoutPwd, updatePassword };
