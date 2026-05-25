import * as usersService from '../services/users.service.js';

const getMe = async (req, res, next) => {
  try {
    const result = await usersService.getByIdWithoutPwd(req.userId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { data, total } = await usersService.getAll(page, limit);
    res.status(200).json({ data, pagination: { page, limit, total } });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const result = await usersService.getById(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const getUserByIdWithoutPwd = async (req, res, next) => {
  try {
    const result = await usersService.getByIdWithoutPwd(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await usersService.updatePassword(req.userId, currentPassword, newPassword);
    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const result = await usersService.update(req.params._id, req.body);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const result = await usersService.deactivate(req.params._id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export { getMe, getUsers, getUserById, getUserByIdWithoutPwd, updatePassword, updateUser, deactivateUser };
