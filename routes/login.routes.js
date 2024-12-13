const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');


router.post('/', (req, res, next) => {
  return login(req, res, next);
});

module.exports = router;