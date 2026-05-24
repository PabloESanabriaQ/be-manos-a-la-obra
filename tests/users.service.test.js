import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/users.model.js', () => {
  const MockUser = vi.fn(function() { return { save: vi.fn() }; });
  MockUser.find = vi.fn();
  MockUser.findById = vi.fn();
  MockUser.countDocuments = vi.fn();
  return { default: MockUser };
});

import User from '../models/users.model.js';
import { getAll, getById, getByIdWithoutPwd } from '../services/users.service.js';
import NotFoundError from '../errors/NotFoundError.js';

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('devuelve todos los usuarios sin password paginados', async () => {
      const fakeUsers = [{ _id: '1', username: 'pablo' }];
      User.find.mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue(fakeUsers),
          }),
        }),
      });
      User.countDocuments.mockResolvedValue(1);

      const result = await getAll(1, 20);

      expect(User.find).toHaveBeenCalledOnce();
      expect(result).toEqual({ data: fakeUsers, total: 1 });
    });
  });

  describe('getById', () => {
    it('devuelve el usuario si existe', async () => {
      const fakeUser = { _id: '1', username: 'pablo' };
      User.findById.mockResolvedValue(fakeUser);

      const result = await getById('1');

      expect(User.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeUser);
    });

    it('lanza NotFoundError si no existe', async () => {
      User.findById.mockResolvedValue(null);

      await expect(getById('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByIdWithoutPwd', () => {
    it('devuelve el usuario sin password', async () => {
      const fakeUser = { _id: '1', username: 'pablo' };
      User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(fakeUser) });

      const result = await getByIdWithoutPwd('1');

      expect(User.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeUser);
    });
  });
});
