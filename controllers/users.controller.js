const usersService = require('../services/users.service');

const getUsers = async (req, res, next) => {
  try {
    const result = await usersService.getAll();
    res.status(200).json({ data: result });
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

module.exports = { getUsers, getUserById, getUserByIdWithoutPwd };
