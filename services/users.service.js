import User from '../models/users.model.js';
import NotFoundError from '../errors/NotFoundError.js';

const getAll = () => User.find().select('-password');

const getById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

const getByIdWithoutPwd = (id) => User.findById(id).select('-password');

export { getAll, getById, getByIdWithoutPwd };
