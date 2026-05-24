import User from '../models/users.model.js';
import NotFoundError from '../errors/NotFoundError.js';

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

export { getAll, getById, getByIdWithoutPwd };
