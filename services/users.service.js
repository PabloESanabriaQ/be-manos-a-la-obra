const User = require('../models/users.model');
const NotFoundError = require('../errors/NotFoundError');

const getAll = () => User.find().select('-password');

const getById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

const getByIdWithoutPwd = (id) => User.findById(id).select('-password');

module.exports = { getAll, getById, getByIdWithoutPwd };
