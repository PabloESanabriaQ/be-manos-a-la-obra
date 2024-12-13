const User = require('../models/users.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UsernameAlreadyExistsError = require('../errors/UsernameAlreadyExistsError');
const InvalidCredentialsError = require('../errors/InvalidCredentialsError');

const register = (req, res, next) => {
  const { username, password, email } = req.body;

  // Verificar si el usuario ya existe
  User.findOne({ username })
    .then(user => {
      if (user) {
        throw new UsernameAlreadyExistsError();
      }

      // Hashear contraseña
      return bcrypt.genSalt(10);
    })
    .then(salt => bcrypt.hash(password, salt))
    .then(hashedPassword => {
      // Crear nuevo usuario
      const newUser = new User({
        username,
        email,
        password: hashedPassword
      });

      return newUser.save();
    })
    .then(user => {
      // Generar token
      const token = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '12h' }
      );

      res.status(201).json({ token });
    })
    .catch(error => {
      next(error);
    });
};

const login = (req, res, next) => {
  const { username, password } = req.body;

  // Verificar si el usuario existe
  User.findOne({ username })
    .then(user => {
      if (!user) {
        throw new InvalidCredentialsError();
      }

      // Verificar contraseña
      return bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (!isMatch) {
            throw new InvalidCredentialsError();
          }

          // Generar token
          const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }
          );

          res.json({ token });
        });
    })
    .catch(error => {
      next(error);
    });
};

module.exports = {
  register,
  login
}
