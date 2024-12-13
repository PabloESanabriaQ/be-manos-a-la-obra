const User = require('../models/users.model');
const NotFoundError = require('../errors/NotFoundError');

const getUsers = (req, res) => {
  User.find()
  .then((result) => {
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err)
  });
}

const getUserById = (req, res, next) => {
  User.findById(req.params._id)
  .then((result) => {
    if (!result) {
        const err = new NotFoundError('User not found');
        err.status = 404;
        throw err;
    }
    res.status(200).json({
      data: result
    });
  })
  .catch((err) => {
    next(err);
  });
}

const getUserByIdWithoutPwd = (req, res, next) => {
  User.findById(req.params._id).select('-password')
  .then(user => {
      res.json(user);
  })
  .catch(error => {
      next(error);
  });
}

module.exports = {
  getUsers,
  getUserById,
  getUserByIdWithoutPwd
};
