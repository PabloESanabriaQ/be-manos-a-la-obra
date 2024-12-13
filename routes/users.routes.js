const express = require('express');
const router = express.Router();
const { getUsers, getUserById } = require('../controllers/users.controller');
const { register } = require('../controllers/auth.controller');

router.get('/', 
	(req, res) => {
    return getUsers(req, res);
  }
);

router.get('/:_id', 
	(req, res, next) => {
    return getUserById(req, res, next);
  }
);

router.post('/', (req, res, next) => {
  return register(req, res, next);
});

module.exports = router;
