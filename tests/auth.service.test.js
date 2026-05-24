import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/users.model.js', () => {
  const MockUser = vi.fn(function() { return { save: vi.fn() }; });
  MockUser.findOne = vi.fn();
  return { default: MockUser };
});

vi.mock('../models/refreshToken.model.js', () => {
  const MockRefreshToken = vi.fn(function() { return { save: vi.fn() }; });
  MockRefreshToken.findOne = vi.fn();
  MockRefreshToken.deleteOne = vi.fn();
  return { default: MockRefreshToken };
});

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn().mockReturnValue('fake-access-token') },
}));

vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('fake-salt'),
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import User from '../models/users.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { register, login, refresh, logout } from '../services/auth.service.js';
import UsernameAlreadyExistsError from '../errors/UsernameAlreadyExistsError.js';
import InvalidCredentialsError from '../errors/InvalidCredentialsError.js';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RefreshToken.mockImplementation(function() {
      return { save: vi.fn().mockResolvedValue({}) };
    });
  });

  describe('register', () => {
    it('crea el usuario y devuelve access + refresh token', async () => {
      const savedUser = { _id: 'user-id', username: 'pablo' };
      const mockInstance = { save: vi.fn().mockResolvedValue(savedUser) };
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(function() { return mockInstance; });

      const result = await register('pablo', 'password123', 'pablo@test.com');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'fake-salt');
      expect(mockInstance.save).toHaveBeenCalledOnce();
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user-id' }, process.env.JWT_SECRET, { expiresIn: '15m' });
      expect(result).toMatchObject({ accessToken: 'fake-access-token', refreshToken: expect.any(String) });
    });

    it('lanza UsernameAlreadyExistsError si el username ya existe', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing-id', username: 'pablo' });

      await expect(register('pablo', 'password123', 'pablo@test.com'))
        .rejects.toThrow(UsernameAlreadyExistsError);
    });
  });

  describe('login', () => {
    it('devuelve access + refresh token con credenciales correctas', async () => {
      const fakeUser = { _id: 'user-id', username: 'pablo', password: 'hashed' };
      User.findOne.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await login('pablo', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user-id' }, process.env.JWT_SECRET, { expiresIn: '15m' });
      expect(result).toMatchObject({ accessToken: 'fake-access-token', refreshToken: expect.any(String) });
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

  describe('refresh', () => {
    it('rota el refresh token y devuelve nuevos tokens', async () => {
      const stored = { token: 'old-token', user: 'user-id', expiresAt: new Date(Date.now() + 10000) };
      RefreshToken.findOne.mockResolvedValue(stored);
      RefreshToken.deleteOne.mockResolvedValue({});

      const result = await refresh('old-token');

      expect(RefreshToken.findOne).toHaveBeenCalledWith({ token: 'old-token' });
      expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ token: 'old-token' });
      expect(result).toMatchObject({ accessToken: 'fake-access-token', refreshToken: expect.any(String) });
    });

    it('lanza InvalidCredentialsError si el token no existe', async () => {
      RefreshToken.findOne.mockResolvedValue(null);

      await expect(refresh('token-invalido')).rejects.toThrow(InvalidCredentialsError);
    });

    it('lanza InvalidCredentialsError si el token está expirado', async () => {
      const expired = { token: 'old-token', user: 'user-id', expiresAt: new Date(Date.now() - 1000) };
      RefreshToken.findOne.mockResolvedValue(expired);
      RefreshToken.deleteOne.mockResolvedValue({});

      await expect(refresh('old-token')).rejects.toThrow(InvalidCredentialsError);
    });

    it('lanza InvalidCredentialsError si no se pasa token', async () => {
      await expect(refresh(undefined)).rejects.toThrow(InvalidCredentialsError);
    });
  });

  describe('logout', () => {
    it('elimina el refresh token de la BD', async () => {
      RefreshToken.deleteOne.mockResolvedValue({});

      await logout('some-token');

      expect(RefreshToken.deleteOne).toHaveBeenCalledWith({ token: 'some-token' });
    });

    it('no falla si no hay token', async () => {
      await expect(logout(undefined)).resolves.not.toThrow();
      expect(RefreshToken.deleteOne).not.toHaveBeenCalled();
    });
  });
});
