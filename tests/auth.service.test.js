import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/users.model.js', () => {
  const MockUser = vi.fn(function() { return { save: vi.fn() }; });
  MockUser.findOne = vi.fn();
  return { default: MockUser };
});

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn().mockReturnValue('fake-token') },
}));

vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('fake-salt'),
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import User from '../models/users.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { register, login } from '../services/auth.service.js';
import UsernameAlreadyExistsError from '../errors/UsernameAlreadyExistsError.js';
import InvalidCredentialsError from '../errors/InvalidCredentialsError.js';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('crea el usuario y devuelve un token', async () => {
      const savedUser = { _id: 'user-id', username: 'pablo' };
      const mockInstance = { save: vi.fn().mockResolvedValue(savedUser) };
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(function() { return mockInstance; });

      const token = await register('pablo', 'password123', 'pablo@test.com');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'fake-salt');
      expect(mockInstance.save).toHaveBeenCalledOnce();
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user-id' }, process.env.JWT_SECRET, { expiresIn: '12h' });
      expect(token).toBe('fake-token');
    });

    it('lanza UsernameAlreadyExistsError si el username ya existe', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing-id', username: 'pablo' });

      await expect(register('pablo', 'password123', 'pablo@test.com'))
        .rejects.toThrow(UsernameAlreadyExistsError);
    });
  });

  describe('login', () => {
    it('devuelve un token con credenciales correctas', async () => {
      const fakeUser = { _id: 'user-id', username: 'pablo', password: 'hashed' };
      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);

      const token = await login('pablo', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user-id' }, process.env.JWT_SECRET, { expiresIn: '12h' });
      expect(token).toBe('fake-token');
    });

    it('lanza InvalidCredentialsError si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(login('noexiste', 'password123'))
        .rejects.toThrow(InvalidCredentialsError);
    });

    it('lanza InvalidCredentialsError si la contraseña es incorrecta', async () => {
      const fakeUser = { _id: 'user-id', username: 'pablo', password: 'hashed' };
      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(login('pablo', 'wrong-password'))
        .rejects.toThrow(InvalidCredentialsError);
    });
  });
});
