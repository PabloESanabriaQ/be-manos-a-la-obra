import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/epics.model.js', () => {
  const MockEpic = vi.fn(function() { return { save: vi.fn() }; });
  MockEpic.find = vi.fn();
  MockEpic.findById = vi.fn();
  MockEpic.findByIdAndUpdate = vi.fn();
  return { default: MockEpic };
});

vi.mock('../models/stories.model.js', () => {
  const MockStory = vi.fn(function() { return { save: vi.fn() }; });
  MockStory.find = vi.fn();
  return { default: MockStory };
});

import Epic from '../models/epics.model.js';
import Story from '../models/stories.model.js';
import { getAll, getById, getStoriesByEpic, create, update } from '../services/epics.service.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

describe('EpicsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('devuelve todas las epics', async () => {
      const fakeEpics = [{ _id: '1', name: 'Epic A' }];
      Epic.find.mockResolvedValue(fakeEpics);

      const result = await getAll();

      expect(Epic.find).toHaveBeenCalledOnce();
      expect(result).toEqual(fakeEpics);
    });
  });

  describe('getById', () => {
    it('devuelve la epic si existe', async () => {
      const fakeEpic = { _id: '1', name: 'Epic A' };
      Epic.findById.mockResolvedValue(fakeEpic);

      const result = await getById('1');

      expect(Epic.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeEpic);
    });

    it('lanza NotFoundError si no existe', async () => {
      Epic.findById.mockResolvedValue(null);

      await expect(getById('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getStoriesByEpic', () => {
    it('devuelve las stories de la epic', async () => {
      const fakeEpic = { _id: '1', name: 'Epic A' };
      const fakeStories = [{ _id: 's1', name: 'Story A', epic: '1' }];
      Epic.findById.mockResolvedValue(fakeEpic);
      Story.find.mockResolvedValue(fakeStories);

      const result = await getStoriesByEpic('1');

      expect(Story.find).toHaveBeenCalledWith({ epic: '1' });
      expect(result).toEqual(fakeStories);
    });

    it('lanza NotFoundError si la epic no existe', async () => {
      Epic.findById.mockResolvedValue(null);

      await expect(getStoriesByEpic('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('guarda y devuelve la nueva epic', async () => {
      const input = { name: 'Nueva epic', project: 'project-id' };
      const saved = { _id: 'nuevo-id', ...input };
      const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
      Epic.mockImplementation(function() { return mockInstance; });

      const result = await create(input);

      expect(mockInstance.save).toHaveBeenCalledOnce();
      expect(result).toEqual(saved);
    });

    it('lanza ValidationError si falta name', () => {
      expect(() => create({ project: 'project-id' })).toThrow(ValidationError);
    });

    it('lanza ValidationError si falta project', () => {
      expect(() => create({ name: 'Epic' })).toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('actualiza y devuelve la epic modificada', async () => {
      const existing = { _id: '1', name: 'Antes', project: { toString: () => 'project-1' } };
      const updated = { _id: '1', name: 'Después', project: 'project-1' };
      Epic.findById.mockResolvedValue(existing);
      Epic.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await update('1', { name: 'Después', project: 'project-1' });

      expect(Epic.findByIdAndUpdate).toHaveBeenCalledWith('1', expect.any(Object), { new: true });
      expect(result).toEqual(updated);
    });

    it('lanza NotFoundError si no existe', async () => {
      Epic.findById.mockResolvedValue(null);

      await expect(update('inexistente', { name: 'x' })).rejects.toThrow(NotFoundError);
    });

    it('lanza ValidationError si falta name', async () => {
      await expect(update('1', {})).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si se intenta cambiar el project', async () => {
      const existing = { _id: '1', name: 'Epic', project: { toString: () => 'project-original' } };
      Epic.findById.mockResolvedValue(existing);

      await expect(update('1', { name: 'Epic', project: 'project-nuevo' }))
        .rejects.toThrow(ValidationError);
    });
  });
});
