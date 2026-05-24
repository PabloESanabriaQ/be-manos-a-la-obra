import * as usersService from '../services/users.service.js';

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

export { getUsers, getUserById, getUserByIdWithoutPwd };
